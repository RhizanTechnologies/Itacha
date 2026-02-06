/**
 * OpenAlex Graph Provider
 *
 * Implements IGraphProvider using the OpenAlex API for real paper data
 * and the LLM citation classifier for edge semantics.
 *
 * Data flow:
 *   1. Fetch paper data from OpenAlex (250M+ works, free, no API key)
 *   2. Build citation edges from referenced_works / citing works
 *   3. Classify each edge via LLM (supports/contradicts/extends) with DB caching
 *   4. Return PaperNode[] + EdgeData[] in the format the canvas expects
 */

import type {
  IGraphProvider,
  PaperNode,
  EdgeData,
  EvidenceItem,
  GraphStats,
  SearchResult,
  TopicCluster,
} from "./graph-api";
import type { OpenAlexWork } from "./openalex-types";
import { extractOpenAlexId, toOpenAlexUrl } from "./openalex-types";
import {
  searchWorks,
  getWork,
  getWorksBatch,
  getCitingWorks,
  getReferencedWorks,
  reconstructAbstract,
} from "./openalex-client";
// Classification is done via API route (server-side) since LLM keys can't be
// exposed in the browser bundle. We call /api/classify from here.
type ClassificationInput = {
  citingId: string;
  citedId: string;
  citingTitle: string;
  citingAbstract: string;
  citedTitle: string;
  citedAbstract: string;
};

type ClassificationResult = ClassificationInput & {
  edgeType: "supports" | "contradicts" | "extends";
  confidence: number;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const CLUSTER_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f97316", // orange
  "#14b8a6", // teal
  "#eab308", // yellow
  "#ef4444", // red
  "#22c55e", // green
];

const EDGE_COLORS: Record<string, string> = {
  supports: "#22c55e",    // green  — matches --supports CSS var
  contradicts: "#ef4444",  // red    — matches --contradicts CSS var
  extends: "#3b82f6",      // blue   — matches --extends CSS var
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Convert an OpenAlex Work to a PaperNode for the graph canvas.
 */
function workToPaperNode(
  work: OpenAlexWork,
  clusterIndex = 0,
): PaperNode {
  const id = extractOpenAlexId(work.id);
  const authors = work.authorships
    .map((a) => a.author.display_name)
    .slice(0, 5)
    .join(", ");
  const firstAuthorLastName =
    work.authorships[0]?.author.display_name.split(" ").pop() ?? "Unknown";
  const year = work.publication_year ?? 2024;
  const title = work.title ?? work.display_name ?? "Untitled";
  const citations = work.cited_by_count ?? 0;
  const venue =
    work.primary_location?.source?.display_name ?? undefined;
  const abstract = reconstructAbstract(work.abstract_inverted_index);

  // Size based on citation count (log scale, clamped)
  const size = Math.min(Math.max(Math.log10(citations + 1) * 5, 4), 30);

  // Cluster assignment from top-level concept
  const topConcept = work.concepts?.[0];
  const cluster = topConcept
    ? Math.abs(hashString(topConcept.display_name)) % CLUSTER_COLORS.length
    : clusterIndex % CLUSTER_COLORS.length;

  return {
    id,
    paperId: id,
    label: `${firstAuthorLastName} (${year})`,
    title,
    authors: authors || "Unknown",
    year,
    venue,
    arxivId: work.ids?.doi ?? undefined,
    citations,
    references: work.referenced_works?.length ?? 0,
    supports: 0, // Will be populated after edge classification
    refutes: 0,
    abstract: abstract || undefined,
    isHighImpact: citations > 100,
    status: "solid",
    cluster,
    x: 0, // ForceAtlas2 handles layout
    y: 0,
    size,
    color: CLUSTER_COLORS[cluster],
  };
}

/** Simple string hash for deterministic cluster assignment */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Call the /api/classify route to classify edges server-side.
 * Falls back to "extends" if the API is unreachable.
 */
async function classifyViaAPI(
  inputs: ClassificationInput[],
): Promise<ClassificationResult[]> {
  try {
    const response = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        citations: inputs.map((i) => ({
          citingId: i.citingId,
          citedId: i.citedId,
          citingTitle: i.citingTitle,
          citingAbstract: i.citingAbstract,
          citedTitle: i.citedTitle,
          citedAbstract: i.citedAbstract,
        })),
      }),
    });

    if (!response.ok) {
      console.warn(`[classify] API returned ${response.status}, using defaults`);
      return inputs.map((i) => ({
        ...i,
        edgeType: "extends" as const,
        confidence: 0.5,
      }));
    }

    const data = await response.json();
    return data.results as ClassificationResult[];
  } catch (err) {
    console.warn("[classify] API unreachable, using default edge types", err);
    return inputs.map((i) => ({
      ...i,
      edgeType: "extends" as const,
      confidence: 0.5,
    }));
  }
}

/**
 * Classify edges between papers using the LLM classifier.
 * Takes source/target paper info and returns classified EdgeData[].
 */
async function classifyEdges(
  edges: { sourceNode: PaperNode; targetNode: PaperNode }[],
): Promise<EdgeData[]> {
  if (edges.length === 0) return [];

  // Build classification inputs
  const inputs: ClassificationInput[] = edges.map(
    ({ sourceNode, targetNode }) => ({
      citingId: sourceNode.id,
      citedId: targetNode.id,
      citingTitle: sourceNode.title,
      citingAbstract: sourceNode.abstract ?? "",
      citedTitle: targetNode.title,
      citedAbstract: targetNode.abstract ?? "",
    }),
  );

  // Classify via API route (server-side LLM call)
  const classifications = await classifyViaAPI(inputs);

  // Map to EdgeData
  return classifications.map((c, i) => ({
    id: `${c.citingId}-${c.citedId}`,
    source: c.citingId,
    target: c.citedId,
    edgeType: c.edgeType,
    confidence: Math.round(c.confidence * 100),
    size: 1 + c.confidence,
    color: EDGE_COLORS[c.edgeType] ?? EDGE_COLORS.extends,
  }));
}

/**
 * Create default (unclassified) edges for when classification is skipped or fails.
 */
function createDefaultEdge(
  sourceId: string,
  targetId: string,
): EdgeData {
  return {
    id: `${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    edgeType: "extends",
    confidence: 50,
    size: 1,
    color: EDGE_COLORS.extends,
  };
}

// =============================================================================
// OPENALEX PROVIDER
// =============================================================================

export class OpenAlexProvider implements IGraphProvider {
  private nodeCache: Map<string, PaperNode> = new Map();
  private edgeCache: EdgeData[] = [];
  private classifyEdgesEnabled: boolean;

  constructor(options?: { classifyEdges?: boolean }) {
    // Always enabled — classification happens server-side via /api/classify route.
    // The check for API keys is done server-side in the route handler.
    this.classifyEdgesEnabled = options?.classifyEdges ?? true;
  }

  // ---------------------------------------------------------------------------
  // searchPapers — Main search entry point
  // ---------------------------------------------------------------------------

  async searchPapers(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    const response = await searchWorks(query, { perPage: 20 });

    return response.results.map((work) => {
      const id = extractOpenAlexId(work.id);
      return {
        id,
        title: work.title ?? work.display_name ?? "Untitled",
        authors: work.authorships
          .map((a) => a.author.display_name)
          .slice(0, 3)
          .join(", "),
        year: work.publication_year ?? 0,
        type: "paper" as const,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // getPaperById — Single paper lookup
  // ---------------------------------------------------------------------------

  async getPaperById(id: string): Promise<PaperNode | null> {
    // Check local cache
    const cached = this.nodeCache.get(id);
    if (cached) return cached;

    try {
      const work = await getWork(id);
      const node = workToPaperNode(work);
      this.nodeCache.set(id, node);
      return node;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // fetchPaperContext — Core graph builder (paper + its citations + references)
  // ---------------------------------------------------------------------------

  async fetchPaperContext(
    paperId: string,
  ): Promise<{ nodes: PaperNode[]; edges: EdgeData[] }> {
    // 1. Fetch the center paper
    const centerWork = await getWork(paperId);
    const centerNode = workToPaperNode(centerWork);
    centerNode.size = Math.max(centerNode.size, 18); // Make center paper prominent
    this.nodeCache.set(centerNode.id, centerNode);

    const nodes: PaperNode[] = [centerNode];
    const nodeIds = new Set<string>([centerNode.id]);
    const edgePairs: { sourceNode: PaperNode; targetNode: PaperNode }[] = [];

    // 2. Fetch papers citing this one (incoming citations)
    const [citingResponse, referencedWorks] = await Promise.all([
      getCitingWorks(paperId, { perPage: 12 }),
      getReferencedWorks(paperId, 12),
    ]);

    // 3. Process citing papers (they cite the center paper)
    for (const work of citingResponse.results) {
      const node = workToPaperNode(work);
      if (!nodeIds.has(node.id)) {
        nodes.push(node);
        nodeIds.add(node.id);
        this.nodeCache.set(node.id, node);
        edgePairs.push({ sourceNode: node, targetNode: centerNode });
      }
    }

    // 4. Process referenced papers (center paper cites them)
    for (const work of referencedWorks) {
      const node = workToPaperNode(work);
      if (!nodeIds.has(node.id)) {
        nodes.push(node);
        nodeIds.add(node.id);
        this.nodeCache.set(node.id, node);
        edgePairs.push({ sourceNode: centerNode, targetNode: node });
      }
    }

    // 5. Classify edges (or use defaults if no LLM keys configured)
    let edges: EdgeData[];
    if (this.classifyEdgesEnabled && edgePairs.length > 0) {
      try {
        edges = await classifyEdges(edgePairs);
      } catch (error) {
        console.warn("[OpenAlexProvider] Edge classification failed, using defaults:", error);
        edges = edgePairs.map(({ sourceNode, targetNode }) =>
          createDefaultEdge(sourceNode.id, targetNode.id),
        );
      }
    } else {
      edges = edgePairs.map(({ sourceNode, targetNode }) =>
        createDefaultEdge(sourceNode.id, targetNode.id),
      );
    }

    // 6. Update support/refute counts on nodes
    this.updateNodeCounts(nodes, edges);
    this.edgeCache = edges;

    return { nodes, edges };
  }

  // ---------------------------------------------------------------------------
  // fetchGraph — Build a graph from a search query (for initial exploration)
  // ---------------------------------------------------------------------------

  async fetchGraph(
    nodeCount: number = 30,
  ): Promise<{ nodes: PaperNode[]; edges: EdgeData[] }> {
    // Return empty graph — the user should search for a paper first.
    // This prevents random ML papers from appearing on canvas load.
    return { nodes: [], edges: [] };
  }

  // ---------------------------------------------------------------------------
  // fetchTopicSlice — Search-based graph with topic clustering
  // ---------------------------------------------------------------------------

  async fetchTopicSlice(query: string): Promise<{
    nodes: PaperNode[];
    edges: EdgeData[];
    clusters: TopicCluster[];
  }> {
    const response = await searchWorks(query, {
      perPage: 40,
      sort: "cited_by_count:desc",
    });

    const nodes: PaperNode[] = [];
    const nodeIds = new Set<string>();

    // Track concepts for cluster generation
    const conceptMap = new Map<string, { color: string; count: number }>();

    for (const work of response.results) {
      const node = workToPaperNode(work);
      if (!nodeIds.has(node.id)) {
        nodes.push(node);
        nodeIds.add(node.id);
        this.nodeCache.set(node.id, node);

        // Track top concept
        const topConcept = work.concepts?.[0];
        if (topConcept && !conceptMap.has(topConcept.display_name)) {
          const colorIdx = conceptMap.size % CLUSTER_COLORS.length;
          conceptMap.set(topConcept.display_name, {
            color: CLUSTER_COLORS[colorIdx],
            count: 0,
          });
        }
        if (topConcept) {
          const entry = conceptMap.get(topConcept.display_name);
          if (entry) entry.count++;
        }
      }
    }

    // Build edges from referenced_works overlap
    const nodeIdSet = new Set(nodes.map((n) => n.id));
    const edgePairs: { sourceNode: PaperNode; targetNode: PaperNode }[] = [];

    for (const work of response.results) {
      const sourceId = extractOpenAlexId(work.id);
      for (const refUrl of work.referenced_works.slice(0, 50)) {
        const targetId = extractOpenAlexId(refUrl);
        if (nodeIdSet.has(targetId) && sourceId !== targetId) {
          const sourceNode = this.nodeCache.get(sourceId);
          const targetNode = this.nodeCache.get(targetId);
          if (sourceNode && targetNode) {
            edgePairs.push({ sourceNode, targetNode });
          }
        }
      }
    }

    // Classify edges
    let edges: EdgeData[];
    if (this.classifyEdgesEnabled && edgePairs.length > 0) {
      try {
        edges = await classifyEdges(edgePairs);
      } catch {
        edges = edgePairs.map(({ sourceNode, targetNode }) =>
          createDefaultEdge(sourceNode.id, targetNode.id),
        );
      }
    } else {
      edges = edgePairs.map(({ sourceNode, targetNode }) =>
        createDefaultEdge(sourceNode.id, targetNode.id),
      );
    }

    // Build clusters from discovered concepts
    const clusters: TopicCluster[] = [];
    let clusterIdx = 0;
    for (const [name, data] of conceptMap.entries()) {
      if (data.count >= 2) {
        // Only include concepts with 2+ papers
        clusters.push({
          id: `c${clusterIdx}`,
          label: name,
          color: data.color,
        });
        clusterIdx++;
      }
      if (clusters.length >= 6) break; // Cap at 6 clusters
    }

    // Fallback: if no clusters formed, create generic ones
    if (clusters.length === 0) {
      clusters.push(
        {
          id: "c0",
          label: `${query} – Core`,
          color: CLUSTER_COLORS[0],
        },
        {
          id: "c1",
          label: `${query} – Applications`,
          color: CLUSTER_COLORS[1],
        },
        {
          id: "c2",
          label: `${query} – Recent`,
          color: CLUSTER_COLORS[2],
        },
      );
    }

    this.updateNodeCounts(nodes, edges);
    this.edgeCache = edges;

    return { nodes, edges, clusters };
  }

  // ---------------------------------------------------------------------------
  // expandNode — Grow the graph from a specific paper
  // ---------------------------------------------------------------------------

  async expandNode(
    nodeId: string,
    direction: "in" | "out",
    type?: "all" | "supports" | "contradicts" | "extends",
  ): Promise<{ nodes: PaperNode[]; edges: EdgeData[] }> {
    const existingNode = this.nodeCache.get(nodeId);
    if (!existingNode) {
      return { nodes: [], edges: [] };
    }

    let works: OpenAlexWork[] = [];

    if (direction === "in") {
      // Papers citing this one
      const response = await getCitingWorks(nodeId, { perPage: 10 });
      works = response.results;
    } else {
      // Papers this one references
      works = await getReferencedWorks(nodeId, 10);
    }

    const nodes: PaperNode[] = [];
    const edgePairs: { sourceNode: PaperNode; targetNode: PaperNode }[] = [];

    for (const work of works) {
      const node = workToPaperNode(work);
      // Skip if we already have this node
      if (this.nodeCache.has(node.id)) continue;

      node.status = "ghost"; // Expanded nodes are "ghost" (suggestions)
      nodes.push(node);
      this.nodeCache.set(node.id, node);

      if (direction === "in") {
        edgePairs.push({ sourceNode: node, targetNode: existingNode });
      } else {
        edgePairs.push({ sourceNode: existingNode, targetNode: node });
      }
    }

    // Classify edges
    let edges: EdgeData[];
    if (this.classifyEdgesEnabled && edgePairs.length > 0) {
      try {
        edges = await classifyEdges(edgePairs);
      } catch {
        edges = edgePairs.map(({ sourceNode, targetNode }) =>
          createDefaultEdge(sourceNode.id, targetNode.id),
        );
      }
    } else {
      edges = edgePairs.map(({ sourceNode, targetNode }) =>
        createDefaultEdge(sourceNode.id, targetNode.id),
      );
    }

    // Filter by edge type if requested
    if (type && type !== "all") {
      edges = edges.filter((e) => e.edgeType === type);
      const allowedTargets = new Set(
        edges.flatMap((e) => [e.source, e.target]),
      );
      const filteredNodes = nodes.filter((n) => allowedTargets.has(n.id));
      this.edgeCache.push(...edges);
      return { nodes: filteredNodes, edges };
    }

    this.edgeCache.push(...edges);
    return { nodes, edges };
  }

  // ---------------------------------------------------------------------------
  // getEvidence — Get evidence snippets for a paper's edges
  // ---------------------------------------------------------------------------

  async getEvidence(paperId: string): Promise<EvidenceItem[]> {
    // Find all edges involving this paper
    const relatedEdges = this.edgeCache.filter(
      (e) => e.source === paperId || e.target === paperId,
    );

    const evidence: EvidenceItem[] = [];

    for (const edge of relatedEdges.slice(0, 5)) {
      const otherNodeId =
        edge.source === paperId ? edge.target : edge.source;
      const otherNode = this.nodeCache.get(otherNodeId);
      if (!otherNode) continue;

      evidence.push({
        id: `ev-${edge.id}`,
        sourcePaper: {
          id: otherNode.id,
          title: otherNode.title,
          authors: otherNode.authors,
          year: otherNode.year,
        },
        relation: edge.edgeType === "contradicts" ? "refutes" : edge.edgeType === "supports" ? "supports" : "extends",
        confidence: edge.confidence,
        snippet: `This paper ${edge.edgeType === "supports" ? "builds upon" : edge.edgeType === "contradicts" ? "challenges" : "extends"} the work by ${otherNode.authors.split(",")[0]?.trim() ?? "the authors"} (${otherNode.year}).`,
        context: "Discussion",
      });
    }

    return evidence;
  }

  // ---------------------------------------------------------------------------
  // getStats — Current graph statistics
  // ---------------------------------------------------------------------------

  getStats(): GraphStats {
    return {
      nodeCount: this.nodeCache.size,
      edgeCount: this.edgeCache.length,
      supportsCount: this.edgeCache.filter((e) => e.edgeType === "supports")
        .length,
      contradictsCount: this.edgeCache.filter(
        (e) => e.edgeType === "contradicts",
      ).length,
      extendsCount: this.edgeCache.filter((e) => e.edgeType === "extends")
        .length,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private updateNodeCounts(nodes: PaperNode[], edges: EdgeData[]): void {
    const supportCounts = new Map<string, number>();
    const refuteCounts = new Map<string, number>();

    for (const edge of edges) {
      if (edge.edgeType === "supports") {
        supportCounts.set(
          edge.target,
          (supportCounts.get(edge.target) ?? 0) + 1,
        );
      } else if (edge.edgeType === "contradicts") {
        refuteCounts.set(
          edge.target,
          (refuteCounts.get(edge.target) ?? 0) + 1,
        );
      }
    }

    for (const node of nodes) {
      node.supports = supportCounts.get(node.id) ?? 0;
      node.refutes = refuteCounts.get(node.id) ?? 0;
    }
  }
}
