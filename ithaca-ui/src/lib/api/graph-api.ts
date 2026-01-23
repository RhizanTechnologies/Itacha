/**
 * Graph API Service
 *
 * This service layer handles all graph-related data fetching.
 * Currently uses mock data, but is structured for easy API integration.
 *
 * TODO: Replace mock implementations with actual API calls when backend is ready.
 */

import Graph from "graphology";
import { FilterState } from "@/components/filters/global-filters";

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
  citations: number;
  references: number;
  supports: number;
  refutes: number;
  abstract?: string;
  aiSummary?: string;
  isHighImpact?: boolean;
  cluster: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  edgeType: "supports" | "contradicts" | "extends";
  confidence: number;
  size: number;
  color: string;
}

export interface EvidenceItem {
  id: string;
  sourcePaper: {
    id: string;
    title: string;
    authors: string;
    year: number;
  };
  relation: "supports" | "refutes" | "extends";
  confidence: number;
  snippet: string;
  source?: string;
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  supportsCount: number;
  contradictsCount: number;
  extendsCount: number;
}

export interface SearchResult {
  id: string;
  title: string;
  authors: string;
  year: number;
  type: "paper" | "author" | "topic";
}

// =============================================================================
// MOCK DATA
// =============================================================================

const PAPER_TITLES = [
  "Attention Is All You Need",
  "BERT: Pre-training of Deep Bidirectional Transformers",
  "GPT-4 Technical Report",
  "Generative Adversarial Networks",
  "Deep Residual Learning for Image Recognition",
  "ImageNet Classification with Deep CNNs",
  "Dropout: A Simple Way to Prevent Overfitting",
  "Adam: A Method for Stochastic Optimization",
  "Batch Normalization: Accelerating Training",
  "Neural Machine Translation by Sequence Learning",
  "Graph Neural Networks: A Review",
  "Transformer Architectures for Protein Folding",
  "Federated Learning with Differential Privacy",
  "Self-Supervised Learning in Computer Vision",
  "Large Language Models for Code Generation",
];

const AUTHORS = [
  "Vaswani et al.",
  "Devlin et al.",
  "OpenAI Research",
  "Goodfellow et al.",
  "He et al.",
  "Krizhevsky et al.",
  "Srivastava et al.",
  "Kingma & Ba",
  "Ioffe & Szegedy",
  "Sutskever et al.",
  "Wu et al.",
  "Jumper et al.",
  "McMahan et al.",
  "Chen et al.",
  "Li et al.",
];

const VENUES = [
  "NeurIPS",
  "ICML",
  "ICLR",
  "CVPR",
  "ACL",
  "EMNLP",
  "Nature",
  "Science",
  "JMLR",
  "AAAI",
];

const ABSTRACTS = [
  "We propose a novel architecture based on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments show these models achieve state-of-the-art performance.",
  "This paper introduces a framework for understanding the complex relationships between academic publications, enabling researchers to identify supporting and contradicting evidence.",
  "We present methods for learning representations of text that can be used for a wide range of downstream NLP tasks with minimal task-specific architecture modifications.",
];

const EDGE_COLORS = {
  supports: "#22c55e", // Green
  contradicts: "#ef4444", // Red
  extends: "#eab308", // Yellow
};

const CLUSTER_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f97316", // Orange
  "#14b8a6", // Teal
];

// =============================================================================
// API SERVICE
// =============================================================================

class GraphAPIService {
  private papers: Map<string, PaperNode> = new Map();
  private edges: EdgeData[] = [];

  /**
   * Fetch graph data from API
   * @param nodeCount - Number of papers to generate (default: 100)
   * TODO: Replace with actual API call
   */
  async fetchGraph(
    nodeCount: number = 100,
  ): Promise<{ nodes: PaperNode[]; edges: EdgeData[] }> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const nodes: PaperNode[] = [];
    const edges: EdgeData[] = [];

    const NODE_COUNT = Math.max(5, Math.min(nodeCount, 200)); // Clamp between 5-200
    const CLUSTERS = 5;

    // Generate nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      const cluster = Math.floor(Math.random() * CLUSTERS);
      const angle = (Math.PI * 2 * i) / NODE_COUNT;
      const radius = Math.random() * 100 + cluster * 50;
      const titleIndex = i % PAPER_TITLES.length;

      const paper: PaperNode = {
        id: String(i),
        paperId: `#${1000 + i}`,
        label: `${AUTHORS[titleIndex].split(" ")[0]} (${
          2019 + Math.floor(Math.random() * 6)
        })`,
        title: PAPER_TITLES[titleIndex],
        authors: AUTHORS[titleIndex],
        year: 2019 + Math.floor(Math.random() * 6),
        venue: VENUES[Math.floor(Math.random() * VENUES.length)],
        arxivId: `arXiv:${2020 + Math.floor(Math.random() * 4)}.${
          10000 + Math.floor(Math.random() * 89999)
        }`,
        citations: Math.floor(Math.random() * 500) + 10,
        references: Math.floor(Math.random() * 50) + 5,
        supports: Math.floor(Math.random() * 20),
        refutes: Math.floor(Math.random() * 5),
        abstract: ABSTRACTS[Math.floor(Math.random() * ABSTRACTS.length)],
        aiSummary:
          "This research advances the field by introducing novel techniques that improve upon existing methods.",
        isHighImpact: Math.random() > 0.8,
        cluster,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        size: Math.random() * 10 + 5,
        color: CLUSTER_COLORS[cluster],
      };

      nodes.push(paper);
      this.papers.set(paper.id, paper);
    }

    // Generate edges with typed relationships
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = 0; j < 2; j++) {
        const target = Math.floor(Math.random() * NODE_COUNT);
        if (target !== i) {
          const edgeType = (["supports", "contradicts", "extends"] as const)[
            Math.floor(Math.random() * 3)
          ];

          const edgeId = `${i}-${target}`;
          // Check for existing edge (undirected or directed depending on need, here directed)
          if (!edges.some((e) => e.id === edgeId)) {
            const edge: EdgeData = {
              id: edgeId,
              source: String(i),
              target: String(target),
              edgeType,
              confidence: Math.floor(Math.random() * 30) + 70,
              size: 1,
              color: EDGE_COLORS[edgeType],
            };
            edges.push(edge);
          }
        }
      }
    }

    this.edges = edges;
    return { nodes, edges };
  }

  /**
   * Get paper details by ID
   * TODO: Replace with actual API call
   */
  async getPaperById(id: string): Promise<PaperNode | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return this.papers.get(id) || null;
  }

  /**
   * Get evidence for a paper
   * TODO: Replace with actual API call
   */
  async getEvidence(paperId: string): Promise<EvidenceItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate mock evidence based on edges
    const evidence: EvidenceItem[] = [];
    const relatedEdges = this.edges.filter(
      (e) => e.source === paperId || e.target === paperId,
    );

    for (const edge of relatedEdges.slice(0, 4)) {
      const otherId = edge.source === paperId ? edge.target : edge.source;
      const otherPaper = this.papers.get(otherId);

      if (otherPaper) {
        evidence.push({
          id: edge.id,
          sourcePaper: {
            id: otherPaper.paperId,
            title: otherPaper.title,
            authors: otherPaper.authors,
            year: otherPaper.year,
          },
          relation: edge.edgeType === "contradicts" ? "refutes" : edge.edgeType,
          confidence: edge.confidence,
          snippet: `"${otherPaper.title
            .split(" ")
            .slice(0, 8)
            .join(" ")}..." provides ${
            edge.edgeType === "supports"
              ? "supporting"
              : edge.edgeType === "contradicts"
                ? "contradicting"
                : "extending"
          } evidence for this claim.`,
          source: `Section ${Math.floor(Math.random() * 5) + 1}, p.${
            Math.floor(Math.random() * 20) + 1
          }`,
        });
      }
    }

    return evidence;
  }

  /**
   * Search papers
   * TODO: Replace with actual API call
   */
  async searchPapers(query: string): Promise<SearchResult[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (!query.trim()) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    this.papers.forEach((paper) => {
      if (
        paper.title.toLowerCase().includes(lowerQuery) ||
        paper.authors.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: paper.id,
          title: paper.title,
          authors: paper.authors,
          year: paper.year,
          type: "paper",
        });
      }
    });

    return results.slice(0, 10);
  }

  /**
   * Get graph statistics
   */
  getStats(): GraphStats {
    return {
      nodeCount: this.papers.size,
      edgeCount: this.edges.length,
      supportsCount: this.edges.filter((e) => e.edgeType === "supports").length,
      contradictsCount: this.edges.filter((e) => e.edgeType === "contradicts")
        .length,
      extendsCount: this.edges.filter((e) => e.edgeType === "extends").length,
    };
  }

  /**
   * Apply filters to graph
   */
  applyFilters(
    graph: Graph,
    filters: FilterState,
  ): { hiddenNodes: Set<string>; hiddenEdges: Set<string> } {
    const hiddenNodes = new Set<string>();
    const hiddenEdges = new Set<string>();

    // Filter edges by relationship type
    graph.forEachEdge((edge, attrs) => {
      const edgeType = attrs.edgeType as string;

      if (
        (edgeType === "supports" && !filters.relationships.supports) ||
        (edgeType === "contradicts" && !filters.relationships.contradicts) ||
        (edgeType === "extends" && !filters.relationships.extends)
      ) {
        hiddenEdges.add(edge);
      }
    });

    // Filter nodes by citation count and year
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
  }
}

// Singleton instance
export const graphAPI = new GraphAPIService();
