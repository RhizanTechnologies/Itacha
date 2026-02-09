"use client";

import { useCallback } from "react";
import {
  useCanvasActions,
  useCanvasRefs,
  useCanvasState,
} from "@/contexts/canvas-context";
import { graphAPI } from "@/lib/api/graph-api";
import { debug } from "@/lib/debug";
import type {
  PaperData,
  EvidenceItem,
} from "@/components/inspector/paper-inspector";
import type { EdgeEvidence } from "@/components/canvas/edge-evidence-popover";

/**
 * Hook for canvas interaction logic: node clicks, edge clicks, focus mode,
 * search, and graph expansion.
 */
export function useCanvasInteraction() {
  const actions = useCanvasActions();
  const refs = useCanvasRefs();
  const state = useCanvasState();

  const handleNodeClick = useCallback(
    (paper: PaperData, evidence: EvidenceItem[]) => {
      actions.selectPaper(paper, evidence);
    },
    [actions],
  );

  const handleEdgeClick = useCallback(
    (
      edgeId: string,
      position: { x: number; y: number },
      evidence: EdgeEvidence,
    ) => {
      actions.showEdgeEvidence(evidence, position);
    },
    [actions],
  );

  const handleEnterFocusMode = useCallback(
    (nodeId: string) => {
      actions.setFocusModeNode(nodeId);
      refs.graphApiRef.current?.focusNodes([nodeId]);
    },
    [actions, refs],
  );

  const handleSearchPaper = useCallback(
    async (paperId: string) => {
      debug.search("Search for paper:", paperId);
      actions.setSearchTarget(paperId);
      actions.setLoading(true);

      try {
        const isTopic = paperId.startsWith("topic-");

        let nodes: any[] = [];
        let edges: any[] = [];

        if (isTopic) {
          const query = paperId.replace("topic-", "");
          const data = await graphAPI.fetchTopicSlice(query, state.paperCount);
          nodes = data.nodes;
          edges = data.edges;
        } else {
          const data = await graphAPI.fetchPaperContext(
            paperId,
            state.paperCount,
          );
          nodes = data.nodes;
          edges = data.edges;
        }

        // Apply relationship focus filter: keep only edges matching the selected type
        const focus = state.relationshipFocus;
        if (focus !== "all") {
          edges = edges.filter((e: any) => e.edgeType === focus);

          // Also remove orphan nodes — nodes with no remaining edges
          const connectedNodeIds = new Set<string>();
          for (const e of edges) {
            connectedNodeIds.add(e.source);
            connectedNodeIds.add(e.target);
          }
          // Always keep the search target node
          if (!isTopic) connectedNodeIds.add(paperId);
          nodes = nodes.filter((n: any) => connectedNodeIds.has(n.id));
        }

        if (refs.graphApiRef.current) {
          refs.graphApiRef.current.addGraphData(nodes, edges, true);
          if (!isTopic) {
            refs.graphApiRef.current.focusNodes([paperId]);
          }
        }

        // Update the paper list panel with newly loaded papers
        if (nodes.length > 0) {
          actions.setVisiblePapers(nodes);
        }
      } catch (e) {
        debug.error("Search failed", e);
      } finally {
        actions.setLoading(false);
      }
    },
    [
      actions,
      refs,
      state.paperCount,
      state.relationshipFocus,
      state.visiblePapers,
    ],
  );

  const handleCommandAction = useCallback(
    (action: string) => {
      switch (action) {
        case "open-filters":
          actions.setFiltersOpen(true);
          break;
        case "export":
          actions.setShareOpen(true);
          break;
        case "toggle-physics":
          actions.togglePhysics();
          break;
        case "reset-view":
          refs.resetViewRef.current?.();
          break;
        case "shortcuts":
        case "settings":
          break;
        default:
          debug.log("Unhandled action:", action);
      }
    },
    [actions, refs],
  );

  return {
    handleNodeClick,
    handleEdgeClick,
    handleEnterFocusMode,
    handleSearchPaper,
    handleCommandAction,
  };
}
