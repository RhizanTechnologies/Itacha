/**
 * Graph API Service
 *
 * Uses OpenAlex + LLM classification for real academic paper data.
 * Exports a singleton `graphAPI` backed by the OpenAlexProvider.
 */

import Graph from "graphology";
import { FilterState } from "@/components/filters/global-filters";
import { OpenAlexProvider } from "./openalex-provider";

// =============================================================================
// TYPES
// =============================================================================

export interface PaperNode {
  id: string;
  paperId: string;
  label: string;
  title: string;
  authors: string;
  year: number;
  venue?: string;
  arxivId?: string;
  doi?: string;
  openAccessUrl?: string;
  citations: number;
  references: number;
  supports: number;
  refutes: number;
  abstract?: string;
  aiSummary?: string;
  isHighImpact?: boolean;
  status?: "solid" | "ghost";
  cluster: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

/** How the classification was determined — drives UI trust indicators */
export type SignalSource =
  | "llm+contexts"
  | "llm+abstracts"
  | "llm+titles"
  | "heuristic"
  | "user-correction"
  | "default";

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  edgeType: "supports" | "contradicts" | "extends" | "cites" | "unknown";
  confidence: number;
  size: number;
  color: string;
  /** LLM-generated explanation of the relationship */
  snippet?: string;
  /** What data the classifier actually had */
  signalSource?: SignalSource;
  /** S2 citation context sentences (the actual in-text references) */
  contexts?: string[];
  /** Which LLM/model classified this edge */
  provider?: string;
}

export interface EvidenceItem {
  id: string;
  sourcePaper: {
    id: string;
    title: string;
    authors: string;
    year: number;
  };
  relation: "supports" | "refutes" | "extends" | "cites" | "unknown";
  confidence: number;
  snippet: string;
  source?: string;
  context?:
    | "Introduction"
    | "Methodology"
    | "Results"
    | "Discussion"
    | "Background"
    | "ResultComparison";
  /** What data the classifier actually had */
  signalSource?: SignalSource;
  /** Original citation context sentences from Semantic Scholar */
  citationSentences?: string[];
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  supportsCount: number;
  contradictsCount: number;
  extendsCount: number;
  citesCount: number;
}

export interface SearchResult {
  id: string;
  title: string;
  authors: string;
  year: number;
  type: "paper" | "author" | "topic";
}

export interface TopicCluster {
  id: string;
  label: string;
  color: string;
}

// =============================================================================
// INTERFACE (The Contract)
// =============================================================================

export interface IGraphProvider {
  fetchGraph(
    nodeCount?: number,
  ): Promise<{ nodes: PaperNode[]; edges: EdgeData[] }>;
  fetchTopicSlice(
    query: string,
    paperCount?: number,
  ): Promise<{
    nodes: PaperNode[];
    edges: EdgeData[];
    clusters: TopicCluster[];
  }>;
  fetchPaperContext(
    paperId: string,
    paperCount?: number,
  ): Promise<{ nodes: PaperNode[]; edges: EdgeData[] }>;
  getPaperById(id: string): Promise<PaperNode | null>;
  getEvidence(paperId: string): Promise<EvidenceItem[]>;
  searchPapers(query: string): Promise<SearchResult[]>;
  searchTopics(query: string): Promise<SearchResult[]>;
  expandNode(
    nodeId: string,
    direction: "in" | "out",
    type?: "all" | "supports" | "contradicts" | "extends",
  ): Promise<{ nodes: PaperNode[]; edges: EdgeData[] }>;
  expandByTopic(
    nodeId: string,
  ): Promise<{ nodes: PaperNode[]; edges: EdgeData[] }>;
  getStats(): GraphStats;
}

// =============================================================================
// GRAPH API SERVICE
// =============================================================================

const provider = new OpenAlexProvider();

export const graphAPI = {
  fetchGraph: (n?: number) => provider.fetchGraph(n),
  fetchTopicSlice: (q: string, paperCount?: number) =>
    provider.fetchTopicSlice(q, paperCount),
  fetchPaperContext: (id: string, paperCount?: number) =>
    provider.fetchPaperContext(id, paperCount),
  getPaperById: (id: string) => provider.getPaperById(id),
  getEvidence: (id: string) => provider.getEvidence(id),
  searchPapers: (q: string) => provider.searchPapers(q),
  searchTopics: (q: string) => provider.searchTopics(q),
  expandNode: (
    id: string,
    dir: "in" | "out",
    type?: "all" | "supports" | "contradicts" | "extends",
  ) => provider.expandNode(id, dir, type),
  expandByTopic: (id: string) => provider.expandByTopic(id),
  getStats: (): GraphStats => provider.getStats(),

  applyFilters(graph: Graph, filters: FilterState) {
    const hiddenNodes = new Set<string>();
    const hiddenEdges = new Set<string>();

    graph.forEachEdge((edge, attrs) => {
      const edgeType = attrs.edgeType as string;
      if (
        (edgeType === "supports" && !filters.relationships.supports) ||
        (edgeType === "contradicts" && !filters.relationships.contradicts) ||
        (edgeType === "extends" && !filters.relationships.extends) ||
        ((edgeType === "cites" || edgeType === "unknown") &&
          !filters.relationships.cites)
      ) {
        hiddenEdges.add(edge);
      }
    });

    graph.forEachNode((node, attrs) => {
      const citations = (attrs.citations as number) || 0;
      const year = (attrs.year as number) || 2024;

      if (
        citations < filters.citationRange[0] ||
        citations > filters.citationRange[1] ||
        year < filters.yearRange[0] ||
        year > filters.yearRange[1]
      ) {
        hiddenNodes.add(node);
      }
    });

    return { hiddenNodes, hiddenEdges };
  },
};
