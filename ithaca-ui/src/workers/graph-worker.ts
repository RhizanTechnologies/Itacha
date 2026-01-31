/**
 * Graph Calculation WebWorker
 * 
 * Offloads expensive graph computations to a background thread.
 * Handles layout calculations, pathfinding, clustering, and filtering.
 */

import Graph from "graphology";
import { findSemanticPath, type PathMode } from "@/lib/graph-algorithms";
import type { FilterState } from "@/components/filters/global-filters";

// =============================================================================
// MESSAGE TYPES
// =============================================================================

export type WorkerMessageType =
  | "INIT_GRAPH"
  | "CALCULATE_LAYOUT"
  | "FIND_PATH"
  | "APPLY_FILTERS"
  | "CALCULATE_CLUSTERS"
  | "GET_SUBGRAPH";

export interface WorkerMessage {
  id: string;
  type: WorkerMessageType;
  payload: any;
}

export interface WorkerResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

// =============================================================================
// WORKER MESSAGE HANDLERS
// =============================================================================

let graph: Graph | null = null;

/**
 * Initialize graph in worker
 */
function handleInitGraph(payload: { nodes: any[]; edges: any[] }): any {
  graph = new Graph();
  
  // Add nodes
  payload.nodes.forEach((node) => {
    graph!.addNode(node.id, node.attributes);
  });
  
  // Add edges
  payload.edges.forEach((edge) => {
    graph!.addEdge(edge.source, edge.target, edge.attributes);
  });
  
  return {
    nodeCount: graph.order,
    edgeCount: graph.size,
  };
}

/**
 * Calculate ForceAtlas2 layout iteration
 */
function handleCalculateLayout(payload: {
  settings: any;
  iterations: number;
}): any {
  if (!graph) throw new Error("Graph not initialized");
  
  // This would use a WebAssembly ForceAtlas2 implementation
  // For now, return current positions
  const positions: Record<string, { x: number; y: number }> = {};
  
  graph.forEachNode((node, attributes) => {
    positions[node] = {
      x: attributes.x || 0,
      y: attributes.y || 0,
    };
  });
  
  return { positions };
}

/**
 * Find path between nodes
 */
function handleFindPath(payload: {
  startId: string;
  endId: string;
  mode: PathMode;
}): any {
  if (!graph) throw new Error("Graph not initialized");
  
  const path = findSemanticPath(
    graph,
    payload.startId,
    payload.endId,
    payload.mode
  );
  
  return { path };
}

/**
 * Apply filters to graph
 */
function handleApplyFilters(payload: { filters: FilterState }): any {
  if (!graph) throw new Error("Graph not initialized");
  
  const visibleNodes: string[] = [];
  const hiddenNodes: string[] = [];
  
  graph.forEachNode((node, attributes) => {
    const year = attributes.year || 2020;
    const citations = attributes.citations || 0;
    
    const passesYearFilter =
      year >= payload.filters.yearRange[0] &&
      year <= payload.filters.yearRange[1];
    
    const passesCitationFilter =
      citations >= payload.filters.citationRange[0] &&
      citations <= payload.filters.citationRange[1];
    
    if (passesYearFilter && passesCitationFilter) {
      visibleNodes.push(node);
    } else {
      hiddenNodes.push(node);
    }
  });
  
  return {
    visibleNodes,
    hiddenNodes,
    visibleCount: visibleNodes.length,
    hiddenCount: hiddenNodes.length,
  };
}

/**
 * Calculate graph clusters
 */
function handleCalculateClusters(payload: { algorithm: string }): any {
  if (!graph) throw new Error("Graph not initialized");
  
  // Would implement clustering algorithm (Louvain, etc.)
  // For now, return mock clusters
  const clusters: Record<string, number> = {};
  
  graph.forEachNode((node) => {
    clusters[node] = Math.floor(Math.random() * 5);
  });
  
  return { clusters };
}

/**
 * Extract subgraph around nodes
 */
function handleGetSubgraph(payload: { nodeIds: string[]; depth: number }): any {
  if (!graph) throw new Error("Graph not initialized");
  
  const subgraphNodes = new Set<string>(payload.nodeIds);
  
  // BFS to find neighbors up to depth
  let currentLayer = new Set(payload.nodeIds);
  
  for (let i = 0; i < payload.depth; i++) {
    const nextLayer = new Set<string>();
    
    currentLayer.forEach((nodeId) => {
      if (graph!.hasNode(nodeId)) {
        graph!.forEachNeighbor(nodeId, (neighbor) => {
          nextLayer.add(neighbor);
          subgraphNodes.add(neighbor);
        });
      }
    });
    
    currentLayer = nextLayer;
  }
  
  // Extract subgraph data
  const nodes: any[] = [];
  const edges: any[] = [];
  
  subgraphNodes.forEach((nodeId) => {
    if (graph!.hasNode(nodeId)) {
      nodes.push({
        id: nodeId,
        attributes: graph!.getNodeAttributes(nodeId),
      });
    }
  });
  
  graph.forEachEdge((edge, attributes, source, target) => {
    if (subgraphNodes.has(source) && subgraphNodes.has(target)) {
      edges.push({
        source,
        target,
        attributes,
      });
    }
  });
  
  return { nodes, edges };
}

// =============================================================================
// WORKER MESSAGE HANDLER
// =============================================================================

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;
  const startTime = performance.now();
  
  try {
    let data: any;
    
    switch (type) {
      case "INIT_GRAPH":
        data = handleInitGraph(payload);
        break;
      case "CALCULATE_LAYOUT":
        data = handleCalculateLayout(payload);
        break;
      case "FIND_PATH":
        data = handleFindPath(payload);
        break;
      case "APPLY_FILTERS":
        data = handleApplyFilters(payload);
        break;
      case "CALCULATE_CLUSTERS":
        data = handleCalculateClusters(payload);
        break;
      case "GET_SUBGRAPH":
        data = handleGetSubgraph(payload);
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    const duration = performance.now() - startTime;
    
    const response: WorkerResponse = {
      id,
      success: true,
      data,
      duration,
    };
    
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    
    self.postMessage(response);
  }
};

export {};
