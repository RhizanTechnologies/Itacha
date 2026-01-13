import Graph from "graphology";

// Paper data types for rich tooltips
export interface PaperNode {
  id: string;
  title: string;
  authors: string;
  year: number;
  citations: number;
  supports: number;
  refutes: number;
  isHighImpact: boolean;
  cluster: number;
}

// Edge relationship types
export type EdgeType = "supports" | "contradicts" | "extends";

// Sample paper titles for realism
const PAPER_TITLES = [
  "Generative Adversarial Networks in Edge Computing",
  "Deep Learning Approaches for Climate Modeling",
  "Quantum Error Correction via Topological Codes",
  "CRISPR-Cas9 Gene Editing in Neural Tissue",
  "Transformer Architectures for Protein Folding",
  "Federated Learning with Differential Privacy",
  "Graph Neural Networks for Drug Discovery",
  "Photonic Computing for Machine Learning",
  "Bayesian Optimization in Hyperparameter Tuning",
  "Reinforcement Learning in Autonomous Systems",
  "Natural Language Understanding via Attention",
  "Multi-Modal Learning for Medical Imaging",
  "Zero-Shot Learning in Computer Vision",
  "Self-Supervised Contrastive Representations",
  "Neural Architecture Search Strategies",
  "Causal Inference in Observational Studies",
  "Adversarial Robustness in Deep Networks",
  "Few-Shot Learning for Rare Disease Detection",
  "Explainable AI for Healthcare Decisions",
  "Diffusion Models for Image Generation",
];

// Author name generator
const FIRST_NAMES = [
  "J.",
  "A.",
  "M.",
  "S.",
  "R.",
  "L.",
  "K.",
  "D.",
  "P.",
  "E.",
];
const LAST_NAMES = [
  "Smith",
  "Chen",
  "Kumar",
  "Doe",
  "Garcia",
  "Kim",
  "Patel",
  "Wilson",
  "Lee",
  "Brown",
];

function generateAuthors(): string {
  const count = Math.floor(Math.random() * 3) + 1;
  const authors: string[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    authors.push(`${first} ${last}`);
  }
  return authors.join(", ") + (count < 3 ? "" : ", et al.");
}

// Edge type colors matching the design
export const EDGE_COLORS: Record<EdgeType, string> = {
  supports: "#4ade80", // Green
  contradicts: "#ef4444", // Red
  extends: "#3b82f6", // Blue
};

// Cluster colors
const CLUSTER_COLORS = [
  "#F94144", // Coral Red
  "#F3722C", // Orange
  "#F9C74F", // Gold
  "#90BE6D", // Sage Green
  "#43AA8B", // Teal
];

export function loadMockGraph(graph: Graph) {
  graph.clear();

  const NODE_COUNT = 100;
  const CLUSTERS = 5;

  // Create Nodes with paper-like attributes
  for (let i = 0; i < NODE_COUNT; i++) {
    const cluster = Math.floor(Math.random() * CLUSTERS);
    const angle = (Math.PI * 2 * i) / NODE_COUNT;
    const radius = Math.random() * 100 + cluster * 50;

    const supports = Math.floor(Math.random() * 200);
    const refutes = Math.floor(Math.random() * 50);
    const citations = supports + refutes + Math.floor(Math.random() * 500);
    const isHighImpact = citations > 500;

    graph.addNode(i, {
      // Position
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,

      // Visual
      size: Math.min(15, 5 + Math.log(citations + 1)),
      color: CLUSTER_COLORS[cluster],

      // Paper metadata
      label: PAPER_TITLES[i % PAPER_TITLES.length],
      paperId: `#${(8000 + i).toString()}`,
      authors: generateAuthors(),
      year: 2019 + Math.floor(Math.random() * 6),
      citations,
      supports,
      refutes,
      isHighImpact,
      cluster,
    });
  }

  // Create Edges with relationship types
  graph.forEachNode((node, attr) => {
    const edgeCount = 2 + Math.floor(Math.random() * 3);

    for (let k = 0; k < edgeCount; k++) {
      const target = Math.floor(Math.random() * NODE_COUNT);
      if (target !== Number(node)) {
        // Randomly assign relationship type
        const types: EdgeType[] = ["supports", "contradicts", "extends"];
        const weights = [0.5, 0.2, 0.3]; // 50% supports, 20% contradicts, 30% extends
        const rand = Math.random();
        let edgeType: EdgeType = "supports";
        if (rand > weights[0]) {
          edgeType = rand > weights[0] + weights[1] ? "extends" : "contradicts";
        }

        const confidence = Math.floor(70 + Math.random() * 30); // 70-100%

        graph.mergeEdgeWithKey(`${node}-${target}`, node, target, {
          size: edgeType === "contradicts" ? 2 : 1,
          color: EDGE_COLORS[edgeType],
          type: "arrow",
          edgeType,
          confidence,
        });
      }
    }
  });

  console.log(
    `Graph loaded with ${graph.order} nodes and ${graph.size} edges.`
  );
  return graph;
}
