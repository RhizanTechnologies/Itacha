/**
 * Citation Classification API Route
 *
 * POST /api/classify
 * Body: { citations: [{ citingId, citedId, citingTitle, citingAbstract, citedTitle, citedAbstract }] }
 * Returns: { results: ClassificationResult[], stats: { cached, classified, failed } }
 *
 * Supports both single and batch classification.
 * Cache-first: only calls LLM for pairs not already in the database.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  classifyBatch,
  type ClassificationInput,
} from "@/lib/api/citation-classifier";

// =============================================================================
// VALIDATION
// =============================================================================

const citationSchema = z.object({
  citingId: z.string().min(1),
  citedId: z.string().min(1),
  citingTitle: z.string().min(1),
  citingAbstract: z.string().default(""),
  citedTitle: z.string().min(1),
  citedAbstract: z.string().default(""),
  // Semantic Scholar citation context enrichment (optional)
  citationContexts: z.array(z.string()).optional(),
  s2Intents: z.array(z.string()).optional(),
});

const requestSchema = z.object({
  citations: z.array(citationSchema).min(1).max(50), // Max 50 per request
});

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { citations } = parsed.data;

    // Classify all citations (cache-first, parallel with concurrency limit)
    const results = await classifyBatch(
      citations as ClassificationInput[],
      3, // concurrency: 3 parallel LLM calls max
    );

    // Compute stats
    const stats = {
      total: results.length,
      cached: results.filter((r) => r.cached).length,
      classified: results.filter((r) => !r.cached && r.provider !== "fallback")
        .length,
      failed: results.filter((r) => r.provider === "fallback").length,
    };

    return NextResponse.json({ results, stats });
  } catch (error) {
    console.error("[/api/classify] Error:", error);

    return NextResponse.json(
      {
        error: "Classification failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
