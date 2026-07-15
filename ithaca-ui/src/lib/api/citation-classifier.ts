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
  // Semantic Scholar citation context enrichment (Phase 2)
  citationContexts?: string[]; // Actual sentences from citing paper referencing cited paper
  s2Intents?: string[]; // S2 intent labels: "Background", "Methodology", "ResultComparison"
}

export interface ClassificationResult {
  citingId: string;
  citedId: string;
  edgeType: "supports" | "contradicts" | "extends" | "cites" | "unknown";
  confidence: number; // 0.0 - 1.0
  snippet: string; // Key sentence explaining the relationship
  provider: string; // Which LLM classified it
  cached: boolean; // Whether this was a cache hit
  /** What data the classifier actually had */
  signalSource:
    | "llm+contexts"
    | "llm+abstracts"
    | "llm+titles"
    | "heuristic"
    | "user-correction"
    | "default";
  /** S2 citation context sentences used as input (if any) */
  contexts?: string[];
}

// =============================================================================
// SYSTEM PROMPTS
// =============================================================================

/**
 * Primary prompt — used when Semantic Scholar citation context sentences are available.
 *
 * Two-step approach:
 *   Step 1: Extract the specific claim the citing authors make about the cited paper.
 *   Step 2: Classify the rhetorical stance based on that claim.
 *
 * The snippet produced here is the extracted claim — grounded in an actual sentence
 * from the paper, not AI-generated text. This serves as the atom for Layer 2
 * (claim-level cross-paper matching).
 */
const CLASSIFICATION_PROMPT = `You are classifying the rhetorical stance of a citing paper toward a cited paper — specifically, what the citing authors claim about the cited work based on in-text citation sentences.

STEP 1 — Extract the claim:
From the CITATION CONTEXT SENTENCES below, identify the specific empirical claim the citing authors make about the cited paper's findings. Write it in one concise sentence (max 25 words) starting with "Authors claim..." or "Authors find...". If the sentence is purely background with no claim, write "Authors cite as background reference."

STEP 2 — Classify the stance:
Based on that extracted claim, classify as:
- "supports"    — Authors explicitly confirm, validate, or agree with the cited paper's specific finding
- "contradicts" — Authors explicitly challenge, refute, or present counter-evidence to the cited paper
- "extends"     — Authors apply the cited paper's method or framework to a meaningfully new domain or problem
- "cites"       — Routine background reference, method use, or no clear directional stance

Confidence rules:
- 0.8+ only when the citation sentence contains explicit agreement/disagreement language
- 0.5–0.7 for directional but ambiguous signals
- Use "cites" with 0.8 confidence when no clear stance is evident — do not guess

CRITICAL RULES:
- You MUST have strong, explicit evidence to classify as supports/contradicts/extends. Default to "cites".
- CITATION CONTEXT SENTENCES are your PRIMARY evidence.
- Proposing an alternative is NOT "contradicts" — there must be explicit disagreement with the cited finding.
- Using a method is NOT "extends" — extension requires applying it to a new domain with novel contribution.
- Pay attention to negation: "does not support", "no evidence for", "failed to replicate" = contradiction.

Respond with ONLY valid JSON: {"edgeType": "...", "confidence": 0.0, "snippet": "Authors claim..."}`;

/**
 * Abstracts-only prompt — used when no S2 citation context is available.
 *
 * This is an inference from two summaries, not extraction from in-text evidence.
 * Confidence is capped at 0.55 (see maxConfidence below).
 * The UI surfaces an "Inferred from abstracts" warning for these edges.
 */
const ABSTRACTS_ONLY_PROMPT = `You are inferring the likely rhetorical relationship between two academic papers using only their titles and abstracts. No direct citation sentences are available.

STEP 1 — Summarize what each paper claims:
- Citing paper claims: [one sentence from its abstract's main finding]
- Cited paper claims: [one sentence from its abstract's main finding]

STEP 2 — Infer the relationship:
Based on these claims, which best describes the likely stance of the citing paper toward the cited paper:
- "supports"    — The citing paper's finding directly confirms the cited paper's finding
- "contradicts" — The citing paper's finding directly opposes the cited paper's finding
- "extends"     — The citing paper applies the cited paper's approach to a meaningfully new context
- "cites"       — No clear directional signal; the abstracts are unrelated or ambiguous

Confidence rules:
- Max 0.55 for any non-"cites" classification — this is inference, not observation
- Use 0.8 for "cites" when genuinely no signal exists

IMPORTANT:
- You are INFERRING. It is acceptable to infer when the abstracts point in a direction, but label your snippet as inference.
- Start the snippet with: "Abstracts suggest authors..."
- Two papers on the same topic with similar methods are NOT automatically "supports" — they may be independent.
- Negative framing ("unlike previous work", "in contrast to") signals contradiction.
- If genuinely ambiguous, use "cites" — it is always better to be honest than to invent a relationship.

Respond with ONLY valid JSON: {"edgeType": "...", "confidence": 0.0, "snippet": "Abstracts suggest authors..."}`;

// =============================================================================
// JSON SANITIZER
// =============================================================================

/**
 * Sanitize LLM JSON output that may be wrapped in markdown code fences,
 * have trailing commas, or contain other common LLM formatting artifacts.
 *
 * Examples of inputs this handles:
 *   ```json\n{"edgeType": "supports"}\n```
 *   ```{"edgeType": "supports"}```
 *   Here is the JSON: {"edgeType": "supports"}
 *   {"edgeType": "supports",}  ← trailing comma
 */
function sanitizeJSON(raw: string): string {
  let s = raw.trim();

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  s = s.replace(/^```(?:json|JSON)?\s*\n?/m, "").replace(/\n?\s*```\s*$/m, "");

  // Extract the first JSON object {...} if surrounded by other text
  const braceMatch = s.match(/(\{[\s\S]*\})/);
  if (braceMatch) {
    s = braceMatch[1];
  }

  // Remove trailing commas before closing braces: {"a": 1,} → {"a": 1}
  s = s.replace(/,\s*([\]}])/g, "$1");

  return s.trim();
}

// =============================================================================
// CLASSIFIER
// =============================================================================

/**
 * Current classifier version — bump when prompt or gate logic changes to invalidate stale cache.
 * v7: Two-step claim extraction prompts, Gate 3 → cites, heuristic fallback wired.
 */
const CLASSIFIER_VERSION = 7;
export const USER_CORRECTION_VERSION = 999;

function isCacheEntryUsable(cached: {
  classifierVersion: number;
  provider: string;
}): boolean {
  if (cached.provider === "user-correction") return true;
  return cached.classifierVersion === CLASSIFIER_VERSION;
}

/**
 * Classify a single citation relationship.
 * Uses evidence-gated logic:
 *   - S2 "Background" intent or no S2 data → "cites" (don't guess)
 *   - S2 "Methodology" only → "cites" (method use ≠ intellectual extension)
 *   - S2 "ResultComparison" or Methodology+ResultComparison → full LLM classification
 *   - Abstracts only (no S2) → LLM inference, confidence capped at 0.55
 *   - Titles only → always "cites"
 */
export async function classifyCitation(
  input: ClassificationInput,
): Promise<ClassificationResult> {
  // 1. Check cache — skip stale entries from old classifier versions
  const cached = await getCachedClassification(input.citingId, input.citedId);
  if (cached && isCacheEntryUsable(cached)) {
    return { ...cached, cached: true, contexts: input.citationContexts };
  }

  // Determine what evidence we have
  const hasContexts =
    input.citationContexts && input.citationContexts.length > 0;
  const hasCitingAbstract =
    !!input.citingAbstract && input.citingAbstract.length > 20;
  const hasCitedAbstract =
    !!input.citedAbstract && input.citedAbstract.length > 20;
  const hasAbstracts = hasCitingAbstract || hasCitedAbstract;
  const intents = input.s2Intents ?? [];
  const hasS2Intents = intents.length > 0; // S2 gave us intent labels (may lack context sentences)
  const hasResultComparison = intents.includes("ResultComparison");
  const hasMethodology = intents.includes("Methodology");
  const hasBackgroundOnly =
    intents.length > 0 && intents.every((i) => i === "Background");

  // =========================================================================
  // EVIDENCE GATING — The core of the "cites as default" approach
  // Only promote to supports/contradicts/extends with real evidence
  // =========================================================================

  // Gate 1: Titles only (no abstracts, no contexts) → always "cites"
  if (!hasContexts && !hasAbstracts) {
    const result: ClassificationResult = {
      citingId: input.citingId,
      citedId: input.citedId,
      edgeType: "cites",
      confidence: 0.9, // High confidence it IS a citation, just unclassified
      snippet:
        "Citation relationship — insufficient evidence for detailed classification.",
      provider: "evidence-gate",
      cached: false,
      signalSource: "default",
    };
    await cacheClassification(result, input.citationContexts, input.s2Intents);
    return result;
  }

  // Gate 2: S2 says "Background" only → "cites" (routine reference, don't waste LLM)
  // Widened: works with intents alone (no context sentences needed)
  if ((hasContexts || hasS2Intents) && hasBackgroundOnly) {
    const result: ClassificationResult = {
      citingId: input.citingId,
      citedId: input.citedId,
      edgeType: "cites",
      confidence: 0.85,
      snippet:
        "Background citation — referenced as prior work without explicit evaluation.",
      provider: "evidence-gate/s2-background",
      cached: false,
      signalSource: "llm+contexts", // S2 contexts were available
      contexts: input.citationContexts,
    };
    await cacheClassification(result, input.citationContexts, input.s2Intents);
    return result;
  }

  // Gate 3: S2 says "Methodology" only (no ResultComparison) → "cites"
  // Rationale: using a method from a prior paper is not extending its intellectual contribution.
  // Methodology + ResultComparison falls through to LLM (they evaluated AND used methods).
  if ((hasContexts || hasS2Intents) && hasMethodology && !hasResultComparison) {
    const result: ClassificationResult = {
      citingId: input.citingId,
      citedId: input.citedId,
      edgeType: "cites",
      confidence: 0.8,
      snippet: "Methodology citation — uses methods from the cited work.",
      provider: "evidence-gate/s2-methodology-use",
      cached: false,
      signalSource: "llm+contexts",
      contexts: input.citationContexts,
    };
    await cacheClassification(result, input.citationContexts, input.s2Intents);
    return result;
  }

  // Gate 3B: S2 says Methodology + ResultComparison → send to LLM (richer than Gate 3)
  // This falls through to the LLM call below — no early return needed.

  // Gate 4: S2 "ResultComparison" (with or without contexts) → full LLM classification
  // Gate 5: No S2 data, but has abstracts → LLM can try, lower confidence
  // Both gates proceed to LLM, but with different confidence caps

  const isAbstractsOnly = !hasContexts && !hasS2Intents && hasAbstracts;
  // Three confidence tiers:
  //   - Full contexts (S2 sentences) → 100%
  //   - Intents only (S2 labels, no sentences) → 70%
  //   - Abstracts only (inferential prompt) → 65%
  // Confidence caps by signal quality:
  //   Full S2 context sentences → up to 1.0 (grounded in actual text)
  //   S2 intent labels only     → up to 0.7 (signal without sentences)
  //   Abstracts only            → up to 0.55 (inference, not observation)
  const maxConfidence = hasContexts ? 1.0 : hasS2Intents ? 0.7 : 0.55;

  // 2. Build user message — include citation contexts from S2 if available
  let userContent = `CITING PAPER: "${input.citingTitle}"
Abstract: ${input.citingAbstract || "No abstract available."}

CITED PAPER: "${input.citedTitle}"
Abstract: ${input.citedAbstract || "No abstract available."}`;

  if (input.citationContexts && input.citationContexts.length > 0) {
    userContent += `\n\nCITATION CONTEXT SENTENCES (extracted from the citing paper's full text where it references the cited paper):
${input.citationContexts.map((ctx, i) => `${i + 1}. "${ctx}"`).join("\n")}`;
  }

  if (input.s2Intents && input.s2Intents.length > 0) {
    userContent += `\n\nSEMANTIC SCHOLAR INTENT LABELS: ${input.s2Intents.join(", ")}`;
  }

  // 3. Try LLM classification
  try {
    const router = getLLMRouter();

    // Select prompt based on signal quality:
    // - With S2 contexts/intents: use strict prompt (evidence-based)
    // - Abstracts only: use inferential prompt (pattern-based)
    const systemPrompt = isAbstractsOnly
      ? ABSTRACTS_ONLY_PROMPT
      : CLASSIFICATION_PROMPT;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    const response = await router.chat(messages, true);

    // 4. Parse response — sanitize LLM output first
    let result: { edgeType: string; confidence: number; snippet: string };
    try {
      const sanitized = sanitizeJSON(response.content);
      result = JSON.parse(sanitized);
    } catch {
      console.warn(
        "[Citation Classifier] Failed to parse LLM JSON, defaulting to cites. Raw:",
        response.content.substring(0, 200),
      );
      // Default to "cites" instead of heuristic guessing
      const fallback: ClassificationResult = {
        citingId: input.citingId,
        citedId: input.citedId,
        edgeType: "cites",
        confidence: 0.5,
        snippet: "Citation relationship — LLM response unparseable.",
        provider: `${response.provider}/${response.model}`,
        cached: false,
        signalSource: isAbstractsOnly ? "llm+abstracts" : "llm+contexts",
        contexts: input.citationContexts,
      };
      await cacheClassification(
        fallback,
        input.citationContexts,
        input.s2Intents,
      );
      return fallback;
    }

    // Validate edgeType — "cites" is the new default instead of "unknown"
    const validTypes = ["supports", "contradicts", "extends", "cites"] as const;
    let edgeType: "supports" | "contradicts" | "extends" | "cites" =
      validTypes.includes(result.edgeType as (typeof validTypes)[number])
        ? (result.edgeType as (typeof validTypes)[number])
        : "cites";

    // Map "unknown" from LLM response to "cites"
    if ((result.edgeType as string) === "unknown") {
      edgeType = "cites";
    }

    // Determine signal source for this classification
    const signalSource = hasContexts
      ? ("llm+contexts" as const)
      : hasAbstracts
        ? ("llm+abstracts" as const)
        : ("llm+titles" as const);

    // Auto-cap confidence based on signal quality
    const rawConfidence = Math.max(
      0,
      Math.min(1, Number(result.confidence) || 0.5),
    );
    const confidence =
      edgeType === "cites"
        ? Math.max(0.5, rawConfidence) // "cites" should have reasonable confidence
        : Math.min(maxConfidence, rawConfidence);

    const classification: ClassificationResult = {
      citingId: input.citingId,
      citedId: input.citedId,
      edgeType,
      confidence,
      snippet: result.snippet || "No explanation available.",
      provider: `${response.provider}/${response.model}`,
      cached: false,
      signalSource,
      contexts: input.citationContexts,
    };

    // 5. Cache the result
    await cacheClassification(
      classification,
      input.citationContexts,
      input.s2Intents,
    );

    return classification;
  } catch (error) {
    // LLM unavailable — fall back to local keyword heuristics rather than a bare default.
    // heuristicClassify uses weighted keyword signals with negation detection.
    console.error(
      `[Citation Classifier] LLM failed for ${input.citingId}→${input.citedId}, using heuristic:`,
      error instanceof Error ? error.message : error,
    );
    const fallback = heuristicClassify(input);
    // Promote to a full ClassificationResult (heuristicClassify returns without citingId/citedId/cached)
    const fullFallback: ClassificationResult = {
      ...fallback,
      citingId: input.citingId,
      citedId: input.citedId,
      cached: false,
      contexts: input.citationContexts,
    };
    await cacheClassification(
      fullFallback,
      input.citationContexts,
      input.s2Intents,
    );
    return fullFallback;
  }
}

// =============================================================================
// HEURISTIC CLASSIFIER (local fallback when LLM is unavailable)
// =============================================================================

/**
 * Negation prefixes that flip a support signal into a contradiction.
 * E.g., "does not support" should NOT count as support.
 */
const NEGATION_PREFIXES = [
  "no ",
  "not ",
  "does not ",
  "do not ",
  "did not ",
  "cannot ",
  "failed to ",
  "lack of ",
  "absence of ",
  "without ",
  "insufficient ",
  "little ",
  "unable to ",
  "hardly ",
  "neither ",
  "never ",
];

/**
 * Phrases that strongly signal contradiction/refutation.
 * Order matters — longer/more specific phrases first to avoid substring issues.
 */
const CONTRADICT_SIGNALS: { phrase: string; weight: number }[] = [
  // Strong explicit refutation signals (weight 3)
  { phrase: "fail to replicate", weight: 3 },
  { phrase: "failed to replicate", weight: 3 },
  { phrase: "could not replicate", weight: 3 },
  { phrase: "not replicated", weight: 3 },
  { phrase: "does not support", weight: 3 },
  { phrase: "do not support", weight: 3 },
  { phrase: "did not support", weight: 3 },
  { phrase: "no evidence", weight: 3 },
  { phrase: "no association", weight: 3 },
  { phrase: "no correlation", weight: 3 },
  { phrase: "no causal", weight: 3 },
  { phrase: "no link", weight: 3 },
  { phrase: "no relationship", weight: 3 },
  { phrase: "no connection", weight: 3 },
  { phrase: "no significant", weight: 2 },
  { phrase: "no effect", weight: 2 },
  { phrase: "no benefit", weight: 2 },
  { phrase: "not effective", weight: 2 },
  { phrase: "not associated", weight: 3 },
  { phrase: "not related", weight: 3 },
  // Direct contradiction verbs (weight 2)
  { phrase: "contradict", weight: 2 },
  { phrase: "refute", weight: 3 },
  { phrase: "disprove", weight: 3 },
  { phrase: "debunk", weight: 3 },
  { phrase: "rebut", weight: 3 },
  { phrase: "retract", weight: 3 },
  { phrase: "retracted", weight: 3 },
  { phrase: "fraudulent", weight: 3 },
  { phrase: "fabricat", weight: 3 },
  { phrase: "misconduct", weight: 3 },
  { phrase: "reject", weight: 2 },
  { phrase: "invalidate", weight: 2 },
  { phrase: "overturned", weight: 2 },
  // Disagreement language (weight 1–2)
  { phrase: "inconsistent with", weight: 2 },
  { phrase: "contrary to", weight: 2 },
  { phrase: "in contrast to", weight: 1 },
  { phrase: "disagree", weight: 2 },
  { phrase: "dispute", weight: 2 },
  { phrase: "flawed", weight: 2 },
  { phrase: "erroneous", weight: 2 },
  { phrase: "incorrect", weight: 2 },
  { phrase: "ineffective", weight: 2 },
  { phrase: "no improvement", weight: 1 },
  { phrase: "did not improve", weight: 1 },
  { phrase: "negative results", weight: 1 },
  { phrase: "opposite", weight: 1 },
  { phrase: "reverses", weight: 1 },
  { phrase: "undermines", weight: 2 },
  { phrase: "questionable", weight: 1 },
  { phrase: "unreliable", weight: 2 },
  { phrase: "unfounded", weight: 2 },
  { phrase: "unsubstantiated", weight: 2 },
  { phrase: "false", weight: 1 },
  { phrase: "myth", weight: 2 },
  { phrase: "safety of", weight: 1 }, // "safety of vaccines" = refuting danger claims
];

/**
 * Phrases that signal support/confirmation.
 * Using full phrases to avoid false positives (e.g., "support" alone matching "does not support").
 */
const SUPPORT_SIGNALS: { phrase: string; weight: number }[] = [
  { phrase: "confirms", weight: 2 },
  { phrase: "confirmed", weight: 2 },
  { phrase: "validates", weight: 2 },
  { phrase: "validated", weight: 2 },
  { phrase: "replicated successfully", weight: 2 },
  { phrase: "successfully reproduced", weight: 2 },
  { phrase: "corroborate", weight: 2 },
  { phrase: "consistent with", weight: 1 },
  { phrase: "in agreement with", weight: 2 },
  { phrase: "in line with", weight: 1 },
  { phrase: "builds on", weight: 1 },
  { phrase: "building on", weight: 1 },
  { phrase: "as shown by", weight: 1 },
  { phrase: "demonstrated by", weight: 1 },
  { phrase: "verified", weight: 2 },
  { phrase: "strengthens", weight: 2 },
  { phrase: "reinforces", weight: 2 },
  { phrase: "lends support", weight: 2 },
  { phrase: "provides evidence for", weight: 2 },
  { phrase: "further evidence for", weight: 2 },
  { phrase: "supports the", weight: 2 },
  { phrase: "supporting the", weight: 2 },
  { phrase: "provides support for", weight: 2 },
];

/**
 * Check if a phrase match is negated by a preceding negation word.
 * Returns true if the match is negated (i.e., should flip meaning).
 */
function isNegated(text: string, matchIndex: number): boolean {
  // Look at the 30 chars before the match for negation prefixes
  const preceding = text.substring(Math.max(0, matchIndex - 30), matchIndex);
  return NEGATION_PREFIXES.some((neg) => preceding.includes(neg));
}

/**
 * Heuristic keyword-based classification — runs locally with no API.
 *
 * Key design decisions:
 * 1. ONLY citing paper text is scanned — the cited paper's own language
 *    (e.g., negative-result papers describing their own findings) must NOT
 *    influence the classification of how ANOTHER paper cites them.
 * 2. Citation context sentences (from S2) are the strongest signal if available.
 * 3. Negation detection — "does not support" counts as contradiction, not support.
 * 4. Weighted signals — "refute" is stronger than "challenge".
 * 5. Phrase-based matching — "support" alone won't match; "supports the" will.
 * 6. Defaults to "extends" with low confidence when no signals found (unknown).
 */
function heuristicClassify(input: ClassificationInput): ClassificationResult {
  // Build text from citing paper ONLY — cited paper text is excluded
  // to prevent directionality errors
  const citingText = [input.citingTitle, input.citingAbstract]
    .join(" ")
    .toLowerCase();

  // Citation context sentences are the most reliable signal
  const contextText = input.citationContexts
    ? input.citationContexts.join(" ").toLowerCase()
    : "";

  let contradictScore = 0;
  let supportScore = 0;
  let contradictSnippet = "";
  let supportSnippet = "";

  // Helper: scan text for signals
  function scanSignals(text: string, multiplier: number) {
    for (const signal of CONTRADICT_SIGNALS) {
      const idx = text.indexOf(signal.phrase);
      if (idx !== -1) {
        contradictScore += signal.weight * multiplier;
        if (!contradictSnippet) contradictSnippet = signal.phrase;
      }
    }

    for (const signal of SUPPORT_SIGNALS) {
      const idx = text.indexOf(signal.phrase);
      if (idx !== -1) {
        // Check for negation — "does not support the" should flip to contradiction
        if (isNegated(text, idx)) {
          contradictScore += signal.weight * multiplier;
          if (!contradictSnippet)
            contradictSnippet = `negated: ${signal.phrase}`;
        } else {
          supportScore += signal.weight * multiplier;
          if (!supportSnippet) supportSnippet = signal.phrase;
        }
      }
    }
  }

  // Citation contexts get highest weight (3x) — these are actual in-text sentences
  if (contextText) {
    scanSignals(contextText, 3);
  }

  // Citing paper abstract gets standard weight (2x)
  scanSignals(citingText, 2);

  // NOTE: cited paper text is NOT scanned — it causes directionality errors

  let edgeType: "supports" | "contradicts" | "extends" | "cites";
  let confidence: number;
  let snippet: string;

  // Threshold-based decision with clear hierarchy
  if (contradictScore >= 4 || (contradictScore >= 2 && supportScore === 0)) {
    edgeType = "contradicts";
    confidence = Math.min(0.5 + contradictScore * 0.05, 0.9);
    snippet = `Likely contradicts — detected signals: "${contradictSnippet}" (heuristic)`;
  } else if (contradictScore > supportScore && contradictScore >= 2) {
    edgeType = "contradicts";
    confidence = Math.min(0.4 + (contradictScore - supportScore) * 0.05, 0.8);
    snippet = `Likely contradicts — detected signals: "${contradictSnippet}" (heuristic)`;
  } else if (
    supportScore >= 4 ||
    (supportScore >= 2 && contradictScore === 0)
  ) {
    edgeType = "supports";
    confidence = Math.min(0.4 + supportScore * 0.05, 0.8);
    snippet = `Likely supports — detected signals: "${supportSnippet}" (heuristic)`;
  } else if (supportScore > contradictScore && supportScore >= 2) {
    edgeType = "supports";
    confidence = Math.min(0.35 + (supportScore - contradictScore) * 0.05, 0.7);
    snippet = `Likely supports — detected signals: "${supportSnippet}" (heuristic)`;
  } else {
    // No strong signals — neutral citation (was "unknown", now "cites")
    edgeType = "cites";
    confidence = 0.7;
    snippet =
      "Citation relationship — no strong directional signals detected (heuristic)";
  }

  return {
    citingId: input.citingId,
    citedId: input.citedId,
    edgeType,
    confidence,
    snippet,
    provider: "heuristic",
    cached: false,
    signalSource: "heuristic" as const,
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
        // If classification fails, return a default "cites"
        results.push({
          citingId: chunk[i].citingId,
          citedId: chunk[i].citedId,
          edgeType: "cites",
          confidence: 0.5,
          snippet: "Citation relationship — classification error.",
          provider: "fallback",
          signalSource: "default" as const,
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
): Promise<
  (Omit<ClassificationResult, "cached"> & { classifierVersion: number }) | null
> {
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
      signalSource: (cached.provider === "user-correction"
        ? "user-correction"
        : "default") as ClassificationResult["signalSource"],
      contexts: cached.contexts
        ? (JSON.parse(cached.contexts) as string[])
        : undefined,
      classifierVersion: cached.classifierVersion ?? 1,
    };
  } catch {
    // If DB is not set up yet or table doesn't exist, skip cache
    return null;
  }
}

async function cacheClassification(
  result: ClassificationResult,
  citationContexts?: string[],
  s2Intents?: string[],
): Promise<void> {
  try {
    const existing = await prisma.citationCache.findUnique({
      where: {
        citingId_citedId: {
          citingId: result.citingId,
          citedId: result.citedId,
        },
      },
      select: { provider: true },
    });
    if (existing?.provider === "user-correction") {
      return;
    }

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
        contexts: citationContexts ? JSON.stringify(citationContexts) : null,
        s2Intents: s2Intents ? s2Intents.join(",") : null,
        classifierVersion: CLASSIFIER_VERSION,
      },
      create: {
        citingId: result.citingId,
        citedId: result.citedId,
        edgeType: result.edgeType,
        confidence: result.confidence,
        snippet: result.snippet,
        provider: result.provider,
        contexts: citationContexts ? JSON.stringify(citationContexts) : null,
        s2Intents: s2Intents ? s2Intents.join(",") : null,
        classifierVersion: CLASSIFIER_VERSION,
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
