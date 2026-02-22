/**
 * Summarize API Route
 *
 * POST /api/summarize
 * Body: { title: string, abstract: string, year?: number }
 * Returns: { summary: string }
 *
 * Generates a concise TL;DR of a paper using the LLM router.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLLMRouter, type LLMMessage } from "@/lib/api/llm-router";
import {
  requireApiAuth,
  checkApiRateLimit,
  isRejection,
} from "@/lib/api/api-auth";

const requestSchema = z.object({
  title: z.string().min(1).max(500),
  abstract: z.string().min(10).max(5000),
  year: z.number().optional(),
});

export async function POST(request: NextRequest) {
  const authResult = await requireApiAuth(request);
  if (isRejection(authResult)) return authResult;

  const rateLimited = await checkApiRateLimit(
    authResult.user.id,
    "summarize",
    30,
  );
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { title, abstract, year } = parsed.data;
    const router = getLLMRouter();

    const messages: LLMMessage[] = [
      {
        role: "system",
        content:
          "You are a research paper summarizer. Given a paper title and abstract, produce a single concise paragraph (2-3 sentences, max 80 words) that captures the key contribution and findings. Write in plain language accessible to a broad scientific audience. Do not start with 'This paper' — start with the key finding or method.",
      },
      {
        role: "user",
        content: `Title: ${title}${year ? ` (${year})` : ""}\n\nAbstract: ${abstract}`,
      },
    ];

    const response = await router.chat(messages);

    return NextResponse.json({ summary: response.content });
  } catch (error) {
    console.error("[/api/summarize] Error:", error);
    return NextResponse.json(
      { error: "Summarization failed" },
      { status: 500 },
    );
  }
}
