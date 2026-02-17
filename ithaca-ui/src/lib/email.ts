/**
 * Email Service for Authentication
 *
 * Handles sending transactional emails for:
 * - Magic link authentication
 * - Email verification
 * - Password reset
 *
 * Uses Resend for email delivery.
 */

import { Resend } from "resend";
import { env } from "./env";

// Initialize Resend with API key if available
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  // Development mode: Log to console if no API key or in dev
  if (env.NODE_ENV === "development" || !resend) {
    console.log("\n📧 [EMAIL] ================");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text || html}`);
    console.log("==========================\n");

    if (!resend) {
      console.warn(
        "⚠️ setup: RESEND_API_KEY is missing. Emails will not be sent.",
      );
    }

    return { success: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "Ithaca <onboarding@resend.dev>",
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Exception sending email:", error);
    return { success: false, error };
  }
}

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail(email: string, url: string) {
  return sendEmail({
    to: email,
    subject: "Sign in to Ithaca",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #137fec;">Sign in to Ithaca</h1>
        <p>Click the link below to sign in to your account:</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #137fec; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Sign In
        </a>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Sign in to Ithaca\n\nClick this link to sign in: ${url}\n\nThis link will expire in 15 minutes.`,
  });
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(email: string, url: string) {
  return sendEmail({
    to: email,
    subject: "Verify your email - Ithaca",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #137fec;">Verify your email</h1>
        <p>Click the link below to verify your email address:</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #137fec; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #666; font-size: 14px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Verify your email\n\nClick this link to verify: ${url}`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, url: string) {
  return sendEmail({
    to: email,
    subject: "Reset your password - Ithaca",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #137fec;">Reset your password</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #137fec; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Reset your password\n\nClick this link to reset: ${url}\n\nThis link will expire in 1 hour.`,
  });
}
