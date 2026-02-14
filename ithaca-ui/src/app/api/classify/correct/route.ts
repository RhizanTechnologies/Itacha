/**
 * Citation Correction API Route
 *
 * POST /api/classify/correct
 * Body: { citingId, citedId, edgeType, comment? }
 *
 * Persists a user correction to the CitationCache, overriding the LLM
 * classification with provider "user-correction" and a high classifier version
 * so it won't be overwritten by future re-classifications.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const correctionSchema = z.object({
  citingId: z.string().min(1),
  citedId: z.string().min(1),
  edgeType: z.enum(["supports", "contradicts", "extends", "unknown"]),
  comment: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = correctionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { citingId, citedId, edgeType, comment } = parsed.data;

    // Upsert with user-correction provider and very high classifierVersion
    // so automatic re-classification won't overwrite it
    const result = await prisma.citationCache.upsert({
      where: {
        citingId_citedId: { citingId, citedId },
      },
      update: {
        edgeType,
        confidence: 1.0,
        snippet: comment
          ? `User correction: ${comment}`
          : `User corrected relationship to "${edgeType}".`,
        provider: "user-correction",
        classifierVersion: 999, // Never overwritten by auto-classification
      },
      create: {
        citingId,
        citedId,
        edgeType,
        confidence: 1.0,
        snippet: comment
          ? `User correction: ${comment}`
          : `User corrected relationship to "${edgeType}".`,
        provider: "user-correction",
        classifierVersion: 999,
      },
    });

    return NextResponse.json({
      success: true,
      id: result.id,
      edgeType: result.edgeType,
    });
  } catch (error) {
    console.error("[classify/correct] Error:", error);
    return NextResponse.json(
      { error: "Failed to persist correction" },
      { status: 500 }
    );
  }
}
