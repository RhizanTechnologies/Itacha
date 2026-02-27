import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 60_000; // 1-minute sliding window

interface AuthResult {
  session: { userId: string };
  user: { id: string; email: string; name: string | null };
}

/**
 * Verify the request has a valid session. Returns the session/user
 * or a 401 NextResponse if unauthenticated.
 */
export async function requireApiAuth(
  request: NextRequest,
): Promise<AuthResult | NextResponse> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  return {
    session: { userId: session.user.id },
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  };
}

/**
 * Database-backed rate limiter. Uses a per-user per-endpoint counter
 * with a 1-minute sliding window. Works correctly on serverless
 * because the state lives in Postgres, not in-memory.
 *
 * Returns null if allowed, or a 429 NextResponse if rate-limited.
 */
export async function checkApiRateLimit(
  userId: string,
  endpoint: string,
  maxPerMinute: number,
): Promise<NextResponse | null> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  try {
    const record = await prisma.apiRateLimit.findUnique({
      where: { userId_endpoint: { userId, endpoint } },
    });

    if (!record || record.windowStart < windowStart) {
      await prisma.apiRateLimit.upsert({
        where: { userId_endpoint: { userId, endpoint } },
        update: { count: 1, windowStart: now },
        create: { userId, endpoint, count: 1, windowStart: now },
      });
      return null;
    }

    if (record.count >= maxPerMinute) {
      const resetAt = new Date(record.windowStart.getTime() + WINDOW_MS);
      const retryAfter = Math.ceil(
        (resetAt.getTime() - now.getTime()) / 1000,
      );

      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfterSeconds: retryAfter },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        },
      );
    }

    await prisma.apiRateLimit.update({
      where: { userId_endpoint: { userId, endpoint } },
      data: { count: { increment: 1 } },
    });

    return null;
  } catch (error) {
    console.error("[rate-limit] DB error, blocking request:", error);
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503, headers: { "Retry-After": "5" } },
    );
  }
}

/**
 * Type guard: returns true if the value is a NextResponse (auth/rate-limit rejection).
 */
export function isRejection(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
