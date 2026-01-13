/**
 * Custom Sigma.js Node Programs with Halo Effects
 *
 * This file provides utilities for hover effects
 * like halos and glows when nodes are hovered or selected.
 */

import { NodeDisplayData } from "sigma/types";

// Type for node attributes with our custom properties
export interface NodeWithHalo extends Partial<NodeDisplayData> {
  highlighted?: boolean;
  isHighImpact?: boolean;
  originalSize?: number;
}

/**
 * Create settings for node hover effects
 * Returns reducers that modify node appearance on hover
 */
export function createHoverReducers() {
  return {
    // Node reducer - applied to each node on hover
    nodeReducer: (
      node: string,
      data: NodeDisplayData,
      hoveredNode: string | null
    ) => {
      const res = { ...data } as NodeWithHalo;

      if (hoveredNode) {
        // Dim non-hovered nodes
        if (node !== hoveredNode) {
          res.color = dimColor(data.color, 0.3);
          res.size = (data.size || 5) * 0.8;
        } else {
          // Highlight hovered node
          res.highlighted = true;
          res.size = (data.size || 5) * 1.2;
        }
      }

      return res as NodeDisplayData;
    },

    // Edge reducer - applied to each edge on hover
    edgeReducer: (
      edge: string,
      data: { color: string; size: number },
      hoveredNode: string | null,
      graph: {
        source: (edge: string) => string;
        target: (edge: string) => string;
      }
    ) => {
      const res = { ...data };

      if (hoveredNode) {
        const source = graph.source(edge);
        const target = graph.target(edge);

        // Highlight edges connected to hovered node
        if (source === hoveredNode || target === hoveredNode) {
          res.size = (data.size || 1) * 2;
        } else {
          res.color = dimColor(data.color, 0.2);
        }
      }

      return res;
    },
  };
}

/**
 * Dim a color by reducing its opacity/brightness
 */
function dimColor(color: string, factor: number): string {
  // Handle hex colors
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${factor})`;
  }

  // Handle rgb/rgba colors
  if (color.startsWith("rgb")) {
    const match = color.match(/[\d.]+/g);
    if (match) {
      const [r, g, b] = match.map(Number);
      return `rgba(${r}, ${g}, ${b}, ${factor})`;
    }
  }

  return color;
}
