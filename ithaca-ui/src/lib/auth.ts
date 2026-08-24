import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { genericOAuth } from "better-auth/plugins";
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

const shouldRequireVerification =
  env.REQUIRE_EMAIL_VERIFICATION !== undefined
    ? env.REQUIRE_EMAIL_VERIFICATION === "true"
    : env.NODE_ENV === "production";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Plugins
  plugins: [
    ...(env.ORCID_CLIENT_ID && env.ORCID_CLIENT_SECRET
      ? [
          genericOAuth({
            config: [
              {
                providerId: "orcid",
                clientId: env.ORCID_CLIENT_ID,
                clientSecret: env.ORCID_CLIENT_SECRET,
                authorizationUrl: "https://orcid.org/oauth/authorize",
                tokenUrl: "https://orcid.org/oauth/token",
                scopes: ["/authenticate"],
              },
            ],
          }),
        ]
      : []),
  ],

  // Email & Password Authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: shouldRequireVerification,
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
    sendOnSignUp: shouldRequireVerification,
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
    useSecureCookies:
      env.NODE_ENV === "production" &&
      process.env.NEXT_PUBLIC_E2E !== "1" &&
      env.BETTER_AUTH_URL.startsWith("https://"),
    generateId: () => crypto.randomUUID(),
  },

  // Rate Limiting — relaxed for automated testing and serial sign-ins
  rateLimit: {
    enabled:
      process.env.NEXT_PUBLIC_E2E !== "1" && process.env.NODE_ENV !== "test",
    window: 60, // 1 minute window
    max: 100, // 100 requests per window
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

  // Trusted Origins — allow local dev ports (3000, 3001, etc.) and wildcards
  trustedOrigins: Array.from(
    new Set([
      env.NEXT_PUBLIC_APP_URL,
      env.BETTER_AUTH_URL,
      "http://localhost:*",
      "https://localhost:*",
      "http://127.0.0.1:*",
      "https://127.0.0.1:*",
      "http://0.0.0.0:*",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
      "http://localhost:3005",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:3002",
      "http://127.0.0.1:3003",
      "http://127.0.0.1:3004",
      "http://127.0.0.1:3005",
    ]),
  ),

  // Base URL
  baseURL: env.BETTER_AUTH_URL,

  // Secret for signing tokens
  secret: env.BETTER_AUTH_SECRET,
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
