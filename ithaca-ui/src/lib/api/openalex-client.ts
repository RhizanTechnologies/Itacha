/**
 * OpenAlex API Client
 *
 * Low-level fetch wrapper for the OpenAlex REST API.
 * Handles rate limiting, retries, polite-pool headers, and abstract reconstruction.
 *
 * Docs: https://docs.openalex.org
 * Rate limits:
 *   - Without email: ~1 req/sec (common pool)
 *   - With email in User-Agent: ~10 req/sec (polite pool)
 */

import type {
  OpenAlexWork,
  OpenAlexListResponse,
  OpenAlexAutocompleteResponse,
} from "./openalex-types";

// =============================================================================
// CONFIGURATION
// =============================================================================

const OPENALEX_BASE = "https://api.openalex.org";

/** Fields we request for works — keeps response size manageable */
const WORK_FIELDS = [
  "id",
  "doi",
  "title",
  "display_name",
  "publication_year",
  "publication_date",
  "type",
  "cited_by_count",
  "cited_by_api_url",
  "referenced_works",
  "related_works",
  "authorships",
  "primary_location",
  "concepts",
  "topics",
  "abstract_inverted_index",
  "open_access",
  "ids",
  "biblio",
].join(",");

/** Shorter field set for search results / lists where we don't need everything */
const SEARCH_FIELDS = [
  "id",
  "title",
  "display_name",
  "publication_year",
  "cited_by_count",
  "authorships",
  "primary_location",
  "concepts",
  "abstract_inverted_index",
  "referenced_works",
  "open_access",
  "ids",
  "type",
].join(",");

// =============================================================================
// RATE LIMITER
// =============================================================================

class SimpleRateLimiter {
  private lastRequest = 0;
  private minInterval: number; // ms between requests

  constructor(requestsPerSecond: number) {
    this.minInterval = 1000 / requestsPerSecond;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequest;
    if (elapsed < this.minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minInterval - elapsed),
      );
    }
    this.lastRequest = Date.now();
  }
}

// Polite pool (with email) = 10 rps, common pool = 1 rps
const rateLimiter = new SimpleRateLimiter(
  process.env.OPENALEX_EMAIL ? 8 : 1, // Leave buffer below actual limits
);

// =============================================================================
// CORE FETCH
// =============================================================================

function getUserAgent(): string {
  const email = process.env.OPENALEX_EMAIL;
  if (email) {
    return `Ithaca/1.0 (mailto:${email})`;
  }
  return "Ithaca/1.0";
}

async function openAlexFetch<T>(
  path: string,
  params: Record<string, string> = {},
  retries = 2,
): Promise<T> {
  await rateLimiter.wait();

  const url = new URL(`${OPENALEX_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  // Always add mailto for polite pool
  const email = process.env.OPENALEX_EMAIL;
  if (email) {
    url.searchParams.set("mailto", email);
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": getUserAgent(),
          Accept: "application/json",
        },
        // Next.js server-side fetch caching
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (response.status === 429) {
        // Rate limited — wait and retry
        const retryAfter = response.headers.get("retry-after");
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
        console.warn(
          `[OpenAlex] Rate limited, waiting ${waitMs}ms (attempt ${attempt + 1}/${retries + 1})`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OpenAlex API error (${response.status}): ${errorText.slice(0, 200)}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (attempt === retries) throw error;
      // Wait before retry on network errors
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * (attempt + 1)),
      );
    }
  }

  throw new Error("[OpenAlex] All retries exhausted");
}

// =============================================================================
// API METHODS
// =============================================================================

/**
 * Search for works by text query.
 * Uses OpenAlex's full-text search which matches titles, abstracts, and full text.
 */
export async function searchWorks(
  query: string,
  options: {
    perPage?: number;
    page?: number;
    sort?: string;
    filter?: string;
  } = {},
): Promise<OpenAlexListResponse<OpenAlexWork>> {
  const params: Record<string, string> = {
    search: query,
    per_page: String(options.perPage ?? 25),
    page: String(options.page ?? 1),
    select: SEARCH_FIELDS,
  };

  if (options.sort) params.sort = options.sort;
  if (options.filter) params.filter = options.filter;

  return openAlexFetch<OpenAlexListResponse<OpenAlexWork>>("/works", params);
}

/**
 * Get a single work by its OpenAlex ID.
 * Accepts both short ("W2741809807") and full ("https://openalex.org/W2741809807") formats.
 */
export async function getWork(id: string): Promise<OpenAlexWork> {
  const cleanId = id.replace("https://openalex.org/", "");
  return openAlexFetch<OpenAlexWork>(`/works/${cleanId}`, {
    select: WORK_FIELDS,
  });
}

/**
 * Get multiple works by their OpenAlex IDs (batched).
 * Uses the filter API: filter=openalex:W123|W456|W789
 */
export async function getWorksBatch(
  ids: string[],
  perPage = 50,
): Promise<OpenAlexWork[]> {
  if (ids.length === 0) return [];

  // Clean IDs and cap at 50 per request (OpenAlex limit for OR filters)
  const cleanIds = ids
    .slice(0, perPage)
    .map((id) => id.replace("https://openalex.org/", ""));

  const filterValue = cleanIds.join("|");

  const response = await openAlexFetch<OpenAlexListResponse<OpenAlexWork>>(
    "/works",
    {
      filter: `openalex:${filterValue}`,
      per_page: String(perPage),
      select: SEARCH_FIELDS,
    },
  );

  return response.results;
}

/**
 * Get works that cite a given paper.
 */
export async function getCitingWorks(
  paperId: string,
  options: { perPage?: number; sort?: string } = {},
): Promise<OpenAlexListResponse<OpenAlexWork>> {
  const cleanId = paperId.replace("https://openalex.org/", "");

  return openAlexFetch<OpenAlexListResponse<OpenAlexWork>>("/works", {
    filter: `cites:${cleanId}`,
    per_page: String(options.perPage ?? 15),
    sort: options.sort ?? "cited_by_count:desc",
    select: SEARCH_FIELDS,
  });
}

/**
 * Get works that a given paper references (cited by this paper).
 * Fetches the referenced_works IDs from the paper, then batch-fetches them.
 */
export async function getReferencedWorks(
  paperId: string,
  limit = 15,
): Promise<OpenAlexWork[]> {
  // First get the paper to find its referenced_works
  const paper = await getWork(paperId);
  const refIds = paper.referenced_works.slice(0, limit);

  if (refIds.length === 0) return [];

  return getWorksBatch(refIds, limit);
}

/**
 * Autocomplete search (fast, for command bar / search-as-you-type).
 */
export async function autocompleteWorks(
  query: string,
): Promise<OpenAlexAutocompleteResponse> {
  return openAlexFetch<OpenAlexAutocompleteResponse>("/autocomplete/works", {
    q: query,
  });
}

// =============================================================================
// UTILITY: Abstract Reconstruction
// =============================================================================

/**
 * OpenAlex stores abstracts as inverted indexes for compression.
 * This reconstructs the full text.
 *
 * Input:  { "We": [0], "propose": [1], "a": [2, 5], "novel": [3], "method": [4, 6] }
 * Output: "We propose a novel method a method"
 */
export function reconstructAbstract(
  invertedIndex: Record<string, number[]> | null | undefined,
): string {
  if (!invertedIndex) return "";

  const words: [string, number][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([word, pos]);
    }
  }

  return words
    .sort((a, b) => a[1] - b[1])
    .map((w) => w[0])
    .join(" ");
}
