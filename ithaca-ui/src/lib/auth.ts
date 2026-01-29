import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { env } from "./env";

// User type for password reset
interface ResetPasswordUser {
  id: string;
  email: string;
  name?: string | null;
}

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
    sendResetPassword: async ({ user, url }: { user: ResetPasswordUser; url: string }) => {
      // TODO: Implement email sending with Resend/SendGrid
      console.log(`[AUTH] Reset password for ${user.email}: ${url}`);
    },
  },

  // OAuth Providers
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    },
    // NOTE: Better Auth does not ship an ORCID provider in core.
    // Adding it here causes runtime errors. Keep the custom provider
    // in src/lib/auth-orcid.ts until a supported custom provider hook is added.
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

  // Rate Limiting
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute window
    max: 10, // 10 requests per window
    storage: "memory", // Use Redis in production
  },

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
