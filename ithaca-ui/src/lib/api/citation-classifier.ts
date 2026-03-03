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
// SYSTEM PROMPT
// =============================================================================

const CLASSIFICATION_PROMPT = `You are a scientific citation classifier. Given two academic papers (a CITING paper and a CITED paper), and CITATION CONTEXT SENTENCES extracted from the citing paper, determine the relationship between them.

You will ONLY be called when Semantic Scholar indicates this may be a meaningful relationship (ResultComparison or Methodology+ResultComparison intents), or when only abstracts are available. Most citations are routine background references — those are handled automatically as "cites" without calling you. Note: sometimes you may receive S2 intent labels without full context sentences — use the intents as a signal alongside the abstracts.

Classify as one of:
- "supports": The citing paper explicitly confirms, validates, builds upon, or agrees with the cited paper's specific findings or methods. There must be clear language of agreement or validation.
- "contradicts": The citing paper explicitly challenges, refutes, presents counter-evidence to, or questions the cited paper's claims. Proposing an alternative approach is NOT contradiction — there must be clear disagreement.
- "extends": The citing paper meaningfully applies the cited paper's methods/ideas to a new domain, dataset, or problem — there must be clear evidence of extension or generalization beyond the original work.
- "cites": The relationship is a routine citation, background reference, or cannot be clearly determined as supports/contradicts/extends from the evidence. This is the safe default when unsure.

Also provide:
- "confidence": A number from 0.0 to 1.0. Only use 0.7+ when the citation context sentences contain explicit language of support, contradiction, or extension. Use 0.5 or lower when the signal is ambiguous.
- "snippet": One concise sentence (max 30 words) explaining the relationship, written from the citing paper's perspective.

CRITICAL RULES:
- You MUST have strong, explicit evidence to classify as supports/contradicts/extends. When in doubt, use "cites".
- CITATION CONTEXT SENTENCES are your PRIMARY evidence. These are the actual sentences from the citing paper where it references the cited paper.
- Proposing an alternative method/approach is NOT "contradicts". That's extending the field, not refuting existing work.
- Citing a paper as background or prior work without explicit evaluation is "cites", not "supports".
- Using a method from a previous paper is NOT automatically "extends" — it could just be "cites" unless there's clear evidence of novel application to a new domain.
- Pay close attention to negation: "does not support", "no evidence", "failed to replicate" indicate contradiction.
- The citing paper's language determines the relationship. Focus on what the citing paper says ABOUT the cited paper.

Respond with ONLY valid JSON: {"edgeType": "...", "confidence": 0.0, "snippet": "..."}`;

/**
 * Separate prompt for abstracts-only edges (Gate 5).
 *
 * The key difference: instead of requiring "strong, explicit evidence" (which
 * rarely exists in abstracts), this prompt asks the LLM to INFER the most likely
 * relationship from linguistic patterns in the abstracts. It still defaults to
 * "cites" when truly ambiguous, but the threshold for detection is lower.
 *
 * This is what makes a knowledge graph product valuable — surfacing likely
 * relationships that exist in the papers but aren't visible from a simple
 * citation list.
 */
const ABSTRACTS_ONLY_PROMPT = `You are a scientific citation classifier. You are given two academic papers — a CITING paper and a CITED paper — with only their titles and abstracts available. No full-text citation context is available for this pair.

Your job is to INFER the most likely relationship by reading between the lines of what each abstract describes. Academic abstracts often contain subtle signals:

- A citing paper that "validates", "confirms", "replicates", or "builds on" prior findings → supports
- A citing paper that "challenges", "questions", "finds no evidence for", or "contradicts" prior claims → contradicts
- A citing paper that applies methods/frameworks to a NEW domain, population, or dataset → extends
- When the abstracts describe unrelated subtopics, or the connection is purely as background → cites

Classify as one of:
- "supports": The abstracts suggest the citing paper confirms, validates, or builds upon the cited paper's specific findings. Look for: similar methodology with confirming results, shared conclusions, language of agreement.
- "contradicts": The abstracts suggest the citing paper challenges or presents opposing evidence to the cited paper. Look for: same question with different answers, negative results on the same topic, language of disagreement.
- "extends": The abstracts suggest the citing paper takes the cited paper's methods, framework, or ideas into a new domain or application. Look for: same approach in different context, generalization, novel application.
- "cites": The relationship is genuinely unclear, the papers work on different specific problems, or there's no meaningful signal in the abstracts. Use this when you truly cannot determine a direction.

Also provide:
- "confidence": 0.0 to 1.0. Use 0.4-0.5 when inferring from weak signals. Use 0.6+ only when abstract language strongly suggests a relationship direction.
- "snippet": One concise sentence (max 30 words) explaining what you inferred and why.

IMPORTANT:
- You are INFERRING, not extracting. It's okay to make a best guess when abstracts point in a direction.
- But don't fabricate — if the abstracts genuinely discuss unrelated things, use "cites".
- Two papers in the same subfield with similar methods are NOT automatically "supports" — they could be independent work.
- Pay attention to temporal signals: if the cited paper proposes X and the citing paper "improves upon X" or "extends X to Y", that's "extends".
- Negative framing ("unlike previous work", "in contrast to") signals contradiction.

Respond with ONLY valid JSON: {"edgeType": "...", "confidence": 0.0, "snippet": "..."}`;

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

/** Current classifier version — bump when logic changes to invalidate stale cache */
const CLASSIFIER_VERSION = 6;

/**
 * Classify a single citation relationship.
 * Uses evidence-gated logic:
 *   - S2 "Background" intent or no S2 data → "cites" (don't guess)
 *   - S2 "Methodology" intent → auto "extends"
 *   - S2 "ResultComparison" intent → send to LLM for real classification
 *   - Abstracts only (no S2) → LLM can suggest, but lower confidence
 *   - Titles only → always "cites"
 */
export async function classifyCitation(
  input: ClassificationInput,
): Promise<ClassificationResult> {
  // 1. Check cache — skip stale entries from old classifier versions
  const cached = await getCachedClassification(input.citingId, input.citedId);
  if (cached && cached.classifierVersion === CLASSIFIER_VERSION) {
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

  // Gate 3: S2 says "Methodology" (no ResultComparison) → auto "extends"
  // Widened: works with intents alone (no context sentences needed)
  if ((hasContexts || hasS2Intents) && hasMethodology && !hasResultComparison) {
    const result: ClassificationResult = {
      citingId: input.citingId,
      citedId: input.citedId,
      edgeType: "extends",
      confidence: 0.7,
      snippet: "Applies or builds upon the methodology from the cited work.",
      provider: "evidence-gate/s2-methodology",
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
  const maxConfidence = hasContexts ? 1.0 : hasS2Intents ? 0.7 : 0.65;

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
    // LLM unavailable — log the actual error so we can debug
    console.error(
      `[Citation Classifier] LLM classification failed for ${input.citingId}→${input.citedId}:`,
      error instanceof Error ? error.message : error,
    );
    const fallback: ClassificationResult = {
      citingId: input.citingId,
      citedId: input.citedId,
      edgeType: "cites",
      confidence: 0.5,
      snippet: "Citation relationship — classifier unavailable.",
      provider: "fallback",
      cached: false,
      signalSource: "default",
      contexts: input.citationContexts,
    };
    await cacheClassification(
      fallback,
      input.citationContexts,
      input.s2Intents,
    );
    return fallback;
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
