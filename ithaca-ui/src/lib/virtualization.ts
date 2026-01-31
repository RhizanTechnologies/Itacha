/**
 * Graph Virtualization System
 *
 * Implements viewport-based node/edge rendering to handle large graphs (10k+ nodes).
 * Only renders elements visible in the current viewport plus a buffer zone.
 */

import Graph from "graphology";
import type { NodeAttributes } from "@/types/graph";
import { debug } from "./debug";

// =============================================================================
// TYPES
// =============================================================================

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  ratio: number; // camera ratio (zoom level)
}

export interface VirtualizationConfig {
  bufferZone: number; // Percentage of viewport to render beyond edges (0.5 = 50%)
  minNodeSize: number; // Minimum node size to render (pixels)
  edgeThreshold: number; // Max edges to render
  updateThrottle: number; // ms between virtualization updates
}

export interface VirtualizedGraph {
  visibleNodes: Set<string>;
  visibleEdges: Set<string>;
  totalNodes: number;
  totalEdges: number;
  visibilityRatio: number;
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

export const DEFAULT_VIRTUALIZATION_CONFIG: VirtualizationConfig = {
  bufferZone: 0.5, // 50% buffer
  minNodeSize: 2, // Don't render nodes smaller than 2px
  edgeThreshold: 5000, // Max 5k edges
  updateThrottle: 100, // Update every 100ms
};

// =============================================================================
// GRAPH VIRTUALIZER CLASS
// =============================================================================

export class GraphVirtualizer {
  private config: VirtualizationConfig;
  private lastUpdate: number = 0;
  private cachedResult: VirtualizedGraph | null = null;

  constructor(config: Partial<VirtualizationConfig> = {}) {
    this.config = { ...DEFAULT_VIRTUALIZATION_CONFIG, ...config };
  }

  /**
   * Calculate visible nodes and edges based on viewport
   */
  computeVisibleElements(graph: Graph, viewport: Viewport): VirtualizedGraph {
    // Throttle updates
    const now = Date.now();
    if (
      this.cachedResult &&
      now - this.lastUpdate < this.config.updateThrottle
    ) {
      return this.cachedResult;
    }

    const startTime = performance.now();

    // Calculate expanded viewport bounds with buffer
    const buffer = this.config.bufferZone;
    const viewportBounds = {
      minX: viewport.x - viewport.width * buffer,
      maxX: viewport.x + viewport.width * (1 + buffer),
      minY: viewport.y - viewport.height * buffer,
      maxY: viewport.y + viewport.height * (1 + buffer),
    };

    const visibleNodes = new Set<string>();
    const visibleEdges = new Set<string>();

    // Find visible nodes
    graph.forEachNode((node, attributes) => {
      const attr = attributes as NodeAttributes;

      // Check if node is in viewport
      if (
        attr.x >= viewportBounds.minX &&
        attr.x <= viewportBounds.maxX &&
        attr.y >= viewportBounds.minY &&
        attr.y <= viewportBounds.maxY
      ) {
        // Check if node is large enough to render
        const screenSize = (attr.size || 5) / viewport.ratio;
        if (screenSize >= this.config.minNodeSize) {
          visibleNodes.add(node);
        }
      }
    });

    // Find edges connecting visible nodes
    let edgeCount = 0;
    graph.forEachEdge((edge, attributes, source, target) => {
      // Stop if we've hit edge threshold
      if (edgeCount >= this.config.edgeThreshold) {
        return;
      }

      // Only render edges between visible nodes
      if (visibleNodes.has(source) && visibleNodes.has(target)) {
        visibleEdges.add(edge);
        edgeCount++;
      }
    });

    const result: VirtualizedGraph = {
      visibleNodes,
      visibleEdges,
      totalNodes: graph.order,
      totalEdges: graph.size,
      visibilityRatio: visibleNodes.size / graph.order,
    };

    this.cachedResult = result;
    this.lastUpdate = now;

    const duration = performance.now() - startTime;
    debug.graph(
      `Virtualization: ${visibleNodes.size}/${graph.order} nodes, ${visibleEdges.size}/${graph.size} edges (${duration.toFixed(2)}ms)`,
    );

    return result;
  }

  /**
   * Apply virtualization by hiding/showing nodes and edges
   */
  applyVirtualization(graph: Graph, virtualized: VirtualizedGraph): void {
    // Hide all nodes first
    graph.forEachNode((node, attributes) => {
      graph.setNodeAttribute(
        node,
        "hidden",
        !virtualized.visibleNodes.has(node),
      );
    });

    // Hide edges not in visible set
    graph.forEachEdge((edge) => {
      graph.setEdgeAttribute(
        edge,
        "hidden",
        !virtualized.visibleEdges.has(edge),
      );
    });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VirtualizationConfig>): void {
    this.config = { ...this.config, ...config };
    this.cachedResult = null; // Invalidate cache
  }

  /**
   * Get current configuration
   */
  getConfig(): VirtualizationConfig {
    return { ...this.config };
  }

  /**
   * Clear cache (force recalculation on next compute)
   */
  clearCache(): void {
    this.cachedResult = null;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate viewport from camera state
 */
export function calculateViewport(
  camera: { x: number; y: number; ratio: number },
  dimensions: { width: number; height: number },
): Viewport {
  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;

  return {
    x: camera.x - halfWidth * camera.ratio,
    y: camera.y - halfHeight * camera.ratio,
    width: dimensions.width * camera.ratio,
    height: dimensions.height * camera.ratio,
    ratio: camera.ratio,
  };
}

/**
 * Check if graph size requires virtualization
 */
export function shouldVirtualize(
  nodeCount: number,
  edgeCount: number,
): boolean {
  // Enable virtualization for graphs with >5k nodes or >20k edges
  return nodeCount > 5000 || edgeCount > 20000;
}

/**
 * Get recommended virtualization config based on graph size
 */
export function getRecommendedConfig(
  nodeCount: number,
  edgeCount: number,
): Partial<VirtualizationConfig> {
  const config: Partial<VirtualizationConfig> = {};

  // Adjust buffer zone based on graph size
  if (nodeCount > 20000) {
    config.bufferZone = 0.3; // Smaller buffer for huge graphs
  } else if (nodeCount > 10000) {
    config.bufferZone = 0.4;
  }

  // Adjust edge threshold
  if (edgeCount > 50000) {
    config.edgeThreshold = 3000;
  } else if (edgeCount > 20000) {
    config.edgeThreshold = 4000;
  }

  // Adjust min node size
  if (nodeCount > 15000) {
    config.minNodeSize = 3; // Hide smaller nodes in huge graphs
  }

  return config;
}

/**
 * Level of Detail (LOD) - adjust node/edge rendering quality based on zoom
 */
export interface LODSettings {
  showLabels: boolean;
  showEdgeLabels: boolean;
  showNodeBorders: boolean;
  edgeQuality: "low" | "medium" | "high";
}

export function calculateLOD(zoomRatio: number): LODSettings {
  // zoomRatio: lower = zoomed in, higher = zoomed out

  return {
    showLabels: zoomRatio < 0.5, // Only show labels when zoomed in
    showEdgeLabels: zoomRatio < 0.3, // Only show edge labels when very zoomed in
    showNodeBorders: zoomRatio < 1.0,
    edgeQuality: zoomRatio < 0.5 ? "high" : zoomRatio < 1.5 ? "medium" : "low",
  };
}
