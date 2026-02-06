"use client";

import { useCallback } from "react";
import {
  useCanvasActions,
  useCanvasRefs,
  useCanvasState,
} from "@/contexts/canvas-context";
import { findSemanticPath } from "@/lib/graph-algorithms";
import { debug } from "@/lib/debug";
import type { PathMode } from "@/components/canvas/path-comparison";

/**
 * Hook for node selection, path comparison, and export selection logic.
 */
export function useCanvasSelection() {
  const state = useCanvasState();
  const actions = useCanvasActions();
  const refs = useCanvasRefs();

  const handleNodeSelect = useCallback(
    (nodeId: string, label: string) => {
      const prev = state.selectedNodes;
      if (prev.includes(nodeId)) {
        actions.setSelectedNodes(prev.filter((id) => id !== nodeId));
      } else {
        actions.setSelectedNodes([...prev, nodeId]);
      }
      actions.setNodeLabels({ ...state.nodeLabels, [nodeId]: label });
    },
    [state.selectedNodes, state.nodeLabels, actions],
  );

  const handleFocusSelection = useCallback(() => {
    if (state.selectedNodes.length === 0 || !refs.graphApiRef.current) return;
    refs.graphApiRef.current.focusNodes(state.selectedNodes);
  }, [state.selectedNodes, refs]);

  const handleExportSelection = useCallback(
    (format: "csv" | "bibtex" = "csv") => {
      if (state.selectedNodes.length === 0 || !refs.graphApiRef.current) return;
      refs.graphApiRef.current.exportSelection(state.selectedNodes, format);
    },
    [state.selectedNodes, refs],
  );

  const calculatePathWithMode = useCallback(
    (mode: PathMode) => {
      debug.graph("Calculating path...", {
        mode,
        selectedNodes: state.selectedNodes,
        api: !!refs.graphApiRef.current,
      });
      if (state.selectedNodes.length < 2 || !refs.graphApiRef.current) {
        debug.warn("Cannot calculate path: missing selection or API");
        return;
      }

      try {
        const paths = refs.graphApiRef.current.findPaths(
          state.selectedNodes[0],
          state.selectedNodes[1],
          mode,
        );
        debug.graph("Paths found:", paths);
        actions.setCalculatedPaths(paths as any[]);
        actions.setPathMode(mode);
        actions.setPathCompareOpen(true);
      } catch (err) {
        debug.error("Error calculating path:", err);
      }
    },
    [state.selectedNodes, refs, actions],
  );

  return {
    handleNodeSelect,
    handleFocusSelection,
    handleExportSelection,
    calculatePathWithMode,
  };
}
