/**
 * Semantic Scholar API Client
 *
 * Fetches citation context sentences and intent labels from S2's Graph API.
 * These provide the actual in-text sentences where a citing paper references
 * a cited paper — far more informative than abstracts alone.
 *
 * API docs: https://api.semanticscholar.org/api-docs/graph
 *
 * Rate limits:
 *   - Without API key: 1 request/second
 *   - With API key: 10 requests/second (apply at https://www.semanticscholar.org/product/api)
 *
 * Environment:
 *   - SEMANTIC_SCHOLAR_API_KEY (optional) — increases rate limits
 */

// =============================================================================
// TYPES
// =============================================================================

/** A single citation relationship with context from S2 */
interface S2CitationContext {
  /** S2 paper ID of the other paper in the relationship */
  paperId: string;
  /** DOI of the other paper (if available) */
  doi?: string;
  /** External IDs for cross-referencing with OpenAlex */
  externalIds?: {
    DOI?: string;
    OpenAlexId?: string;
    [key: string]: string | undefined;
  };
  /** Actual sentences from the citing paper's full text where the citation appears */
  contexts: string[];
  /** S2 intent classification: "Background", "Methodology", "ResultComparison" */
  intents: string[];
  /** Whether S2 considers this a highly influential citation */
  isInfluential: boolean;
  /** Title of the other paper for debugging */
  title?: string;
}

/** Raw S2 API citation/reference edge */
interface S2RawCitationEdge {
  citingPaper?: S2RawPaper;
  citedPaper?: S2RawPaper;
  contexts?: string[];
  intents?: string[];
  isInfluential?: boolean;
}

interface S2RawPaper {
  paperId: string;
  externalIds?: {
    DOI?: string;
    OpenAlexId?: string;
    [key: string]: string | undefined;
  };
  title?: string;
}

// =============================================================================
// RATE LIMITER
// =============================================================================

class S2RateLimiter {
  private lastRequestTime = 0;
  private readonly minInterval: number;

  constructor(hasApiKey: boolean) {
    // S2 rate limit: 1 req/sec for all tiers (cumulative across endpoints)
    // Add 50ms buffer to stay safely under the limit
    this.minInterval = hasApiKey ? 1050 : 1050;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minInterval - elapsed),
      );
    }
    this.lastRequestTime = Date.now();
  }
}

// =============================================================================
// CLIENT
// =============================================================================

const S2_BASE_URL = "https://api.semanticscholar.org/graph/v1";
const CITATION_FIELDS = "contexts,intents,isInfluential";
const PAPER_FIELDS_IN_CITATION = "paperId,externalIds,title";

let rateLimiter: S2RateLimiter | null = null;

function getRateLimiter(): S2RateLimiter {
  if (!rateLimiter) {
    rateLimiter = new S2RateLimiter(!!getApiKey());
  }
  return rateLimiter;
}

// =============================================================================
// IN-MEMORY S2 REFERENCE CACHE
// =============================================================================

/**
 * Module-level cache for S2 reference lookups.
 * Key: cleaned citing DOI
 * Value: the full array of S2CitationContext for that citing paper's references
 *
 * Persists for the lifetime of the server process (cleared on restart).
 * Prevents re-fetching the same citing paper's references across multiple
 * graph loads / edge-classification calls within the same session.
 */
const s2ReferenceCache = new Map<string, S2CitationContext[]>();

function getApiKey(): string | undefined {
  return process.env.SEMANTIC_SCHOLAR_API_KEY;
}

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/json",
  };
  const apiKey = getApiKey();
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }
  return headers;
}

/**
 * Fetch citation contexts for papers that the given paper REFERENCES.
 * Returns the in-text sentences and intent labels.
 *
 * This is typically what we need: for a citing paper C that references paper R,
 * this gives us the context sentences where C mentions R.
 *
 * @param doi - The DOI of the citing paper
 * @param limit - Max number of referenced papers to return (default 500)
 */
async function getS2ReferenceContexts(
  doi: string,
  limit = 500,
): Promise<S2CitationContext[]> {
  const cleanDoi = cleanDOI(doi);
  if (!cleanDoi) return [];

  try {
    await getRateLimiter().wait();

    const url = `${S2_BASE_URL}/paper/DOI:${cleanDoi}/references?fields=${CITATION_FIELDS},${PAPER_FIELDS_IN_CITATION}&limit=${limit}`;

    const response = await fetch(url, {
      headers: buildHeaders(),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[S2] Paper not found: DOI:${cleanDoi}`);
        return [];
      }
      if (response.status === 429) {
        console.warn("[S2] Rate limited, skipping reference contexts");
        return [];
      }
      console.warn(`[S2] References API returned ${response.status}`);
      return [];
    }

    const data = (await response.json()) as { data: S2RawCitationEdge[] };

    return (data.data || [])
      .filter((edge) => edge.citedPaper?.paperId)
      .map((edge) => ({
        paperId: edge.citedPaper!.paperId,
        doi: edge.citedPaper?.externalIds?.DOI,
        externalIds: edge.citedPaper?.externalIds,
        contexts: edge.contexts || [],
        intents: edge.intents || [],
        isInfluential: edge.isInfluential || false,
        title: edge.citedPaper?.title,
      }));
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.warn("[S2] Request timed out for references");
    } else {
      console.warn("[S2] Error fetching references:", error);
    }
    return [];
  }
}

/**
 * Batch-fetch citation contexts for multiple citing papers.
 * Groups by citing paper DOI to minimize API calls (one call per unique citing DOI).
 *
 * @param pairs - Array of { citingDoi, citedDoi, citingId, citedId }
 * @returns Map from "citingId→citedId" to { contexts, intents }
 */
export async function batchGetCitationContexts(
  pairs: {
    citingDoi?: string;
    citedDoi?: string;
    citingId: string;
    citedId: string;
  }[],
): Promise<Map<string, { contexts: string[]; intents: string[] }>> {
  const result = new Map<string, { contexts: string[]; intents: string[] }>();

  // Group pairs by citing DOI — one S2 API call per unique citing paper
  const byCitingDoi = new Map<
    string,
    { citedDoi: string; citingId: string; citedId: string }[]
  >();

  for (const pair of pairs) {
    if (!pair.citingDoi || !pair.citedDoi) continue;

    const cleanCiting = cleanDOI(pair.citingDoi);
    if (!cleanCiting) continue;

    const existing = byCitingDoi.get(cleanCiting) || [];
    existing.push({
      citedDoi: pair.citedDoi,
      citingId: pair.citingId,
      citedId: pair.citedId,
    });
    byCitingDoi.set(cleanCiting, existing);
  }

  console.log(
    `[S2] Fetching citation contexts for ${byCitingDoi.size} unique citing papers`,
  );

  // Fetch references for each unique citing paper
  for (const [citingDoi, targets] of byCitingDoi) {
    try {
      // Check in-memory cache first — avoid re-fetching from S2 API
      // for a citing paper we already looked up this session.
      let references: S2CitationContext[];
      if (s2ReferenceCache.has(citingDoi)) {
        references = s2ReferenceCache.get(citingDoi)!;
        console.log(
          `[S2] Cache hit for DOI:${citingDoi} (${references.length} refs)`,
        );
      } else {
        references = await getS2ReferenceContexts(citingDoi);
        s2ReferenceCache.set(citingDoi, references);
        console.log(
          `[S2] Cached ${references.length} refs for DOI:${citingDoi}`,
        );
      }

      // Build a DOI→contexts lookup for this citing paper's references
      const refByDoi = new Map<
        string,
        { contexts: string[]; intents: string[] }
      >();
      for (const ref of references) {
        const refDoi = cleanDOI(ref.doi || "");
        // Accept matches with intents OR contexts — many S2 records have
        // intent labels (Background/Methodology/ResultComparison) without
        // full-text context sentences, and those intents are still valuable
        // for gate routing in the classifier.
        if (refDoi && (ref.contexts.length > 0 || ref.intents.length > 0)) {
          refByDoi.set(refDoi.toLowerCase(), {
            contexts: ref.contexts,
            intents: ref.intents,
          });
        }
      }

      // Match each target cited paper
      for (const target of targets) {
        const cleanCited = cleanDOI(target.citedDoi);
        if (!cleanCited) continue;

        const match = refByDoi.get(cleanCited.toLowerCase());
        if (match) {
          const key = `${target.citingId}→${target.citedId}`;
          result.set(key, match);
        }
      }
    } catch (error) {
      console.warn(
        `[S2] Error fetching references for DOI:${citingDoi}:`,
        error,
      );
    }
  }

  console.log(
    `[S2] Found citation contexts for ${result.size}/${pairs.length} pairs`,
  );

  return result;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Clean a DOI string by removing URL prefixes and whitespace.
 * "https://doi.org/10.1234/foo" → "10.1234/foo"
 */
function cleanDOI(doi: string): string | null {
  if (!doi) return null;

  let cleaned = doi.trim();

  // Remove common URL prefixes
  cleaned = cleaned.replace(/^https?:\/\/doi\.org\//i, "");
  cleaned = cleaned.replace(/^doi:/i, "");

  // Basic DOI format validation: starts with "10."
  if (!cleaned.startsWith("10.")) return null;

  return cleaned;
}

