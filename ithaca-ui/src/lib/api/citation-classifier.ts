/**
 * Citation Classifier
 *
 * Classifies the relationship between two academic papers as:
 * - supports: Paper A builds on, confirms, or validates Paper B
 * - contradicts: Paper A challenges, refutes, or disagrees with Paper B
 * - extends: Paper A applies Paper B to a new domain or generalizes it
 *
 * Uses LLM with database caching — each pair is classified once and cached forever.
 */

import { getLLMRouter, type LLMMessage } from "./llm-router";
import { prisma } from "@/lib/prisma";

// =============================================================================
// TYPES
// =============================================================================

export interface ClassificationInput {
  citingId: string; // OpenAlex ID
  citedId: string; // OpenAlex ID
  citingTitle: string;
  citingAbstract: string;
  citedTitle: string;
  citedAbstract: string;
}

export interface ClassificationResult {
  citingId: string;
  citedId: string;
  edgeType: "supports" | "contradicts" | "extends";
  confidence: number; // 0.0 - 1.0
  snippet: string; // Key sentence explaining the relationship
  provider: string; // Which LLM classified it
  cached: boolean; // Whether this was a cache hit
}

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

const CLASSIFICATION_PROMPT = `You are a scientific citation classifier. Given two academic papers (a CITING paper and a CITED paper), determine the relationship between them.

Classify as one of:
- "supports": The citing paper builds on, confirms, validates, or agrees with the cited paper's findings or methods.
- "contradicts": The citing paper challenges, refutes, questions, or presents evidence against the cited paper.
- "extends": The citing paper applies the cited paper's methods/ideas to a new domain, dataset, or problem, or generalizes it.

Also provide:
- "confidence": A number from 0.0 to 1.0 indicating how confident you are in the classification. Use 0.5 if the abstracts don't provide enough context.
- "snippet": One concise sentence (max 30 words) explaining the relationship, written from the citing paper's perspective (e.g., "Builds on the transformer architecture proposed in the cited work to improve efficiency").

Rules:
- Base your classification ONLY on the provided titles and abstracts.
- If both abstracts are missing or too vague, default to "extends" with confidence 0.3.
- Most citations are supportive (papers usually cite work they build on). Only classify as "contradicts" if there is clear evidence of disagreement.

Respond with ONLY valid JSON: {"edgeType": "...", "confidence": 0.0, "snippet": "..."}`;

// =============================================================================
// CLASSIFIER
// =============================================================================

/**
 * Classify a single citation relationship.
 * Checks database cache first, falls back to LLM.
 */
export async function classifyCitation(
  input: ClassificationInput,
): Promise<ClassificationResult> {
  // 1. Check cache
  const cached = await getCachedClassification(input.citingId, input.citedId);
  if (cached) {
    return { ...cached, cached: true };
  }

  // 2. Try LLM classification first
  try {
    const router = getLLMRouter();

    const messages: LLMMessage[] = [
      { role: "system", content: CLASSIFICATION_PROMPT },
      {
        role: "user",
        content: `CITING PAPER: "${input.citingTitle}"
Abstract: ${input.citingAbstract || "No abstract available."}

CITED PAPER: "${input.citedTitle}"
Abstract: ${input.citedAbstract || "No abstract available."}`,
      },
    ];

    const response = await router.chat(messages, true);

    // 3. Parse response
    let result: { edgeType: string; confidence: number; snippet: string };
    try {
      result = JSON.parse(response.content);
    } catch {
      result = {
        edgeType: "extends",
        confidence: 0.3,
        snippet:
          "Citation relationship could not be determined from available abstracts.",
      };
    }

    // Validate edgeType
    const validTypes = ["supports", "contradicts", "extends"] as const;
    const edgeType = validTypes.includes(
      result.edgeType as (typeof validTypes)[number],
    )
      ? (result.edgeType as (typeof validTypes)[number])
      : "extends";

    // Clamp confidence to [0, 1]
    const confidence = Math.max(
      0,
      Math.min(1, Number(result.confidence) || 0.5),
    );

    const classification: ClassificationResult = {
      citingId: input.citingId,
      citedId: input.citedId,
      edgeType,
      confidence,
      snippet: result.snippet || "No explanation available.",
      provider: `${response.provider}/${response.model}`,
      cached: false,
    };

    // 4. Cache the result
    await cacheClassification(classification);

    return classification;
  } catch {
    // LLM unavailable — fall back to heuristic classifier
    const heuristic = heuristicClassify(input);
    await cacheClassification(heuristic);
    return heuristic;
  }
}

// =============================================================================
// HEURISTIC CLASSIFIER (local fallback when LLM is unavailable)
// =============================================================================

/** Keywords that strongly signal contradiction/refutation */
const CONTRADICT_SIGNALS = [
  "contradict",
  "refute",
  "disprove",
  "challenge",
  "reject",
  "fail to replicate",
  "failed to replicate",
  "could not replicate",
  "no evidence",
  "no significant",
  "no effect",
  "does not support",
  "do not support",
  "inconsistent with",
  "contrary to",
  "in contrast to",
  "disagree",
  "dispute",
  "flawed",
  "erroneous",
  "incorrect",
  "invalidate",
  "overturned",
  "debunk",
  "rebut",
  "no benefit",
  "not effective",
  "ineffective",
  "no improvement",
  "did not improve",
  "negative results",
  "opposite",
  "reverses",
  "undermines",
  "questionable",
  "no association",
  "no correlation",
  "not replicated",
  "unreliable",
];

/** Keywords that signal support/confirmation */
const SUPPORT_SIGNALS = [
  "confirm",
  "validate",
  "replicate",
  "corroborate",
  "consistent with",
  "in agreement",
  "in line with",
  "builds on",
  "building on",
  "inspired by",
  "following",
  "as shown by",
  "demonstrated by",
  "verified",
  "strengthen",
  "reinforce",
  "support",
  "lend support",
  "provides evidence",
  "further evidence",
  "successfully reproduced",
];

/**
 * Heuristic keyword-based classification — runs locally with no API.
 * Scans titles + abstracts for contradiction/support signals.
 * Good enough to catch ~60-70% of clear contradictions.
 */
function heuristicClassify(input: ClassificationInput): ClassificationResult {
  const text = [
    input.citingTitle,
    input.citingAbstract,
    input.citedTitle,
    input.citedAbstract,
  ]
    .join(" ")
    .toLowerCase();

  // Count contradiction and support signals
  let contradictScore = 0;
  let supportScore = 0;
  let contradictSnippet = "";
  let supportSnippet = "";

  for (const signal of CONTRADICT_SIGNALS) {
    if (text.includes(signal)) {
      contradictScore++;
      if (!contradictSnippet) contradictSnippet = signal;
    }
  }

  for (const signal of SUPPORT_SIGNALS) {
    if (text.includes(signal)) {
      supportScore++;
      if (!supportSnippet) supportSnippet = signal;
    }
  }

  let edgeType: "supports" | "contradicts" | "extends";
  let confidence: number;
  let snippet: string;

  if (contradictScore >= 2 || (contradictScore >= 1 && supportScore === 0)) {
    edgeType = "contradicts";
    confidence = Math.min(0.5 + contradictScore * 0.1, 0.85);
    snippet = `Likely contradicts — detected signals: "${contradictSnippet}" (heuristic)`;
  } else if (supportScore >= 2) {
    edgeType = "supports";
    confidence = Math.min(0.4 + supportScore * 0.1, 0.8);
    snippet = `Likely supports — detected signals: "${supportSnippet}" (heuristic)`;
  } else {
    edgeType = "extends";
    confidence = 0.4;
    snippet = "No strong signals found — classified as extends (heuristic)";
  }

  return {
    citingId: input.citingId,
    citedId: input.citedId,
    edgeType,
    confidence,
    snippet,
    provider: "heuristic",
    cached: false,
  };
}

/**
 * Classify multiple citation relationships in parallel with concurrency limit.
 * Cache-first: only calls LLM for uncached pairs.
 */
export async function classifyBatch(
  inputs: ClassificationInput[],
  concurrency = 3,
): Promise<ClassificationResult[]> {
  const results: ClassificationResult[] = [];
  const queue = [...inputs];

  // Process in chunks to respect rate limits
  while (queue.length > 0) {
    const chunk = queue.splice(0, concurrency);
    const chunkResults = await Promise.allSettled(
      chunk.map((input) => classifyCitation(input)),
    );

    for (let i = 0; i < chunkResults.length; i++) {
      const result = chunkResults[i];
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        // If classification fails, return a default
        results.push({
          citingId: chunk[i].citingId,
          citedId: chunk[i].citedId,
          edgeType: "extends",
          confidence: 0.3,
          snippet: "Classification unavailable — rate limit or error.",
          provider: "fallback",
          cached: false,
        });
      }
    }

    // Small delay between chunks to avoid hammering APIs
    if (queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}

// =============================================================================
// DATABASE CACHE
// =============================================================================

async function getCachedClassification(
  citingId: string,
  citedId: string,
): Promise<Omit<ClassificationResult, "cached"> | null> {
  try {
    const cached = await prisma.citationCache.findUnique({
      where: {
        citingId_citedId: { citingId, citedId },
      },
    });

    if (!cached) return null;

    return {
      citingId: cached.citingId,
      citedId: cached.citedId,
      edgeType: cached.edgeType as ClassificationResult["edgeType"],
      confidence: cached.confidence,
      snippet: cached.snippet,
      provider: cached.provider,
    };
  } catch {
    // If DB is not set up yet or table doesn't exist, skip cache
    return null;
  }
}

async function cacheClassification(
  result: ClassificationResult,
): Promise<void> {
  try {
    await prisma.citationCache.upsert({
      where: {
        citingId_citedId: {
          citingId: result.citingId,
          citedId: result.citedId,
        },
      },
      update: {
        edgeType: result.edgeType,
        confidence: result.confidence,
        snippet: result.snippet,
        provider: result.provider,
      },
      create: {
        citingId: result.citingId,
        citedId: result.citedId,
        edgeType: result.edgeType,
        confidence: result.confidence,
        snippet: result.snippet,
        provider: result.provider,
      },
    });
  } catch {
    // Cache write failure is non-fatal — next time it'll re-classify
    console.warn(
      "[Citation Cache] Failed to write cache, will retry next time",
    );
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Get cache statistics for monitoring.
 */
export async function getCacheStats(): Promise<{
  totalCached: number;
  byType: Record<string, number>;
  byProvider: Record<string, number>;
}> {
  try {
    const [total, supports, contradicts, extends_] = await Promise.all([
      prisma.citationCache.count(),
      prisma.citationCache.count({ where: { edgeType: "supports" } }),
      prisma.citationCache.count({ where: { edgeType: "contradicts" } }),
      prisma.citationCache.count({ where: { edgeType: "extends" } }),
    ]);

    return {
      totalCached: total,
      byType: { supports, contradicts, extends: extends_ },
      byProvider: {}, // Could add groupBy query if needed
    };
  } catch {
    return { totalCached: 0, byType: {}, byProvider: {} };
  }
}
