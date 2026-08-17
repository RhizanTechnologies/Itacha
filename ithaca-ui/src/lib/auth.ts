import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { env } from "./env";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";
import { getRedis } from "./platform/redis";

// User type for password reset
interface ResetPasswordUser {
  id: string;
  email: string;
  name?: string | null;
}

const redis = getRedis();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Email & Password Authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({
      user,
      url,
    }: {
      user: ResetPasswordUser;
      url: string;
    }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },

  // Email Verification — top-level config required by Better Auth
  // This powers both the auto-send on signup AND the /api/auth/send-verification-email endpoint
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: ResetPasswordUser;
      url: string;
    }) => {
      await sendVerificationEmail(user.email, url);
    },
    autoSignInAfterVerification: true,
  },

  // OAuth Providers
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    },
  },

  // Session Configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Security Settings
  advanced: {
    cookiePrefix: "ithaca",
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: env.NODE_ENV === "production",
    generateId: () => crypto.randomUUID(),
  },

  // Rate Limiting — disabled during Playwright e2e (serial sign-ins in setup)
  rateLimit: {
    enabled: process.env.NEXT_PUBLIC_E2E !== "1",
    window: 60, // 1 minute window
    max: 10, // 10 requests per window
    storage: redis ? "secondary-storage" : "memory",
  },

  secondaryStorage: redis
    ? {
        get: (key) => redis.get(key),
        set: async (key, value, ttl) => {
          if (ttl) await redis.set(key, value, { ex: ttl });
          else await redis.set(key, value);
        },
        delete: async (key) => {
          await redis.del(key);
        },
        increment: async (key, ttl) => {
          const value = await redis.incr(key);
          if (value === 1) await redis.expire(key, ttl);
          return value;
        },
      }
    : undefined,

  // CSRF Protection
  csrf: {
    enabled: true,
    cookieName: "ithaca.csrf-token",
  },

  // Trusted Origins
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],

  // Base URL
  baseURL: env.BETTER_AUTH_URL,

  // Secret for signing tokens
  secret: env.BETTER_AUTH_SECRET,
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
