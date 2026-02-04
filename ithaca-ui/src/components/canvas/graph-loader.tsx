"use client";

import { useEffect, useState, useRef } from "react";
import { useLoadGraph, useSigma, useRegisterEvents } from "@react-sigma/core";
import Graph from "graphology";
import * as graphApiModule from "@/lib/api/graph-api";
import type { PaperNode, EdgeData } from "@/lib/api/graph-api";
import { useEdgeFlowAnimation } from "@/hooks/useEdgeFlowAnimation";
import { debug } from "@/lib/debug";
import { findSemanticPath } from "@/lib/graph-algorithms";
import {
  GRAPH,
  COLORS,
  CONTROVERSY,
  FILTERS,
  ANIMATION,
} from "@/lib/constants";
import type { CanvasInteractionApi } from "@/types/graph";
import type { FilterState } from "@/components/filters/global-filters";
import type {
  PaperData,
  EvidenceItem,
} from "@/components/inspector/paper-inspector";
import type { EdgeEvidence } from "@/components/canvas/edge-evidence-popover";
import type { PathMode } from "@/components/canvas/path-comparison";

// =============================================================================
// GRAPH LOADER COMPONENT
// =============================================================================

// Safely retrieve the API instance
const graphAPI = graphApiModule.graphAPI;

export interface GraphLoaderProps {
  onNodeClick: (paper: PaperData, evidence: EvidenceItem[]) => void;
  onNodeSelect?: (nodeId: string, label: string) => void;
  onEdgeClick?: (
    edgeId: string,
    position: { x: number; y: number },
    evidence: EdgeEvidence,
  ) => void;
  selectionMode?: boolean;
  focusNode?: string | null;
  focusModeNode?: string | null;
  onStatsChange: (stats: { nodeCount: number; edgeCount: number }) => void;
  onDataRangesChange?: (ranges: {
    minYear: number;
    maxYear: number;
    maxCitations: number;
  }) => void;
  onFilterStatsChange?: (stats: {
    hiddenNodes: number;
    hiddenEdges: number;
  }) => void;
  onRegisterInteractionApi?: (api: CanvasInteractionApi) => void;
  onRegisterExport?: (exportFn: () => Promise<string>) => void;
  onRegisterReset?: (resetFn: () => void) => void;
  onRegisterSigmaGraph?: (sigma: any, graph: Graph) => void;
  filters: FilterState;
  paperCount: number;
  refreshTrigger: number;
  solidNodes: Set<string>;
  onAddToProject: (nodeId: string) => void;
}

/**
 * GraphLoader - Handles graph data loading, filtering, interactions, and state management.
 * Must be rendered inside a SigmaContainer to access Sigma context hooks.
 */
export function GraphLoader({
  onNodeClick,
  onNodeSelect,
  onEdgeClick,
  selectionMode = false,
  focusNode,
  onStatsChange,
  onDataRangesChange,
  onFilterStatsChange,
  onRegisterInteractionApi,
  onRegisterExport,
  onRegisterReset,
  onRegisterSigmaGraph,
  filters,
  paperCount,
  refreshTrigger,
  focusModeNode,
  solidNodes,
  onAddToProject,
}: GraphLoaderProps) {
  const loadGraph = useLoadGraph();
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdges, setHoveredEdges] = useState<Set<string>>(new Set());
  const graphRef = useRef<Graph | null>(null);

  // Load graph data from API
  useEffect(() => {
    async function loadGraphData() {
      const { nodes, edges } = await graphAPI.fetchGraph(paperCount);

      const graph = new Graph();

      // Calculate data ranges for dynamic filters
      let minYear = Infinity;
      let maxYear = -Infinity;
      let maxCitations = 0;

      nodes.forEach((node) => {
        if (node.year < minYear) minYear = node.year;
        if (node.year > maxYear) maxYear = node.year;
        if (node.citations > maxCitations) maxCitations = node.citations;
      });

      // Fallback values if no data
      if (minYear === Infinity) minYear = FILTERS.MIN_YEAR;
      if (maxYear === -Infinity) maxYear = FILTERS.MAX_YEAR;
      if (maxCitations === 0) maxCitations = FILTERS.DEFAULT_MAX_CITATIONS;

      // Report data ranges
      onDataRangesChange?.({
        minYear,
        maxYear,
        maxCitations,
      });

      // Calculate controversy metrics
      const controversyScores = new Map<string, number>();

      edges.forEach((edge) => {
        if (edge.edgeType === "contradicts") {
          const targetId =
            typeof edge.target === "string" ? edge.target : String(edge.target);
          const current = controversyScores.get(targetId) || 0;
          controversyScores.set(targetId, current + 1);
        }
      });

      debug.graph("Controversy Scores:", Object.fromEntries(controversyScores));

      // Add nodes with all attributes and visual highlights for controversy
      nodes.forEach((node) => {
        const score = controversyScores.get(node.id) || 0;
        const isControversial = score >= CONTROVERSY.THRESHOLD;

        graph.addNode(node.id, {
          ...node,
          originalSize: node.size,
          hidden: false,
          controversyScore: score,
          highlighted: isControversial,
          // Set initial color based on controversy
          color: isControversial
            ? COLORS.CONTRADICTS
            : node.color || COLORS.CLUSTERS[node.cluster],
        });
      });

      // Add edges with all attributes
      edges.forEach((edge) => {
        graph.mergeEdgeWithKey(edge.id, edge.source, edge.target, {
          ...edge,
          originalColor: edge.color,
          hidden: false,
        });
      });

      graphRef.current = graph;
      loadGraph(graph);

      // Register sigma and graph for export
      if (onRegisterSigmaGraph) {
        onRegisterSigmaGraph(sigma, graph);
      }

      // Report stats
      onStatsChange({
        nodeCount: graph.order,
        edgeCount: graph.size,
      });
    }

    loadGraphData();
  }, [
    loadGraph,
    onStatsChange,
    onDataRangesChange,
    paperCount,
    refreshTrigger,
    sigma,
    onRegisterSigmaGraph,
  ]);

  // Apply filters when they change
  useEffect(() => {
    const graph = graphRef.current || sigma.getGraph();
    if (!graph || graph.order === 0) return;

    const { hiddenNodes, hiddenEdges } = graphAPI.applyFilters(graph, filters);

    // If Focus Mode is active, override filtering logic
    let effectiveHiddenNodes = hiddenNodes;
    let effectiveHiddenEdges = hiddenEdges;

    if (focusModeNode && graph.hasNode(focusModeNode)) {
      const neighbors = graph.neighbors(focusModeNode);
      const visibleSet = new Set([focusModeNode, ...neighbors]);

      effectiveHiddenNodes = new Set();
      effectiveHiddenEdges = new Set();

      // Hide all nodes not in the visible set
      graph.forEachNode((node) => {
        if (!visibleSet.has(node)) {
          effectiveHiddenNodes.add(node);
        }
      });

      // Hide all edges where at least one endpoint is hidden
      graph.forEachEdge((edge, _attrs, source, target) => {
        if (!visibleSet.has(source) || !visibleSet.has(target)) {
          effectiveHiddenEdges.add(edge);
        }
      });
    }

    // Update node visibility
    graph.forEachNode((node, attrs) => {
      const isHidden = effectiveHiddenNodes.has(node);
      graph.setNodeAttribute(node, "hidden", isHidden);
      // In focus mode, strict hiding (user request: "remove all in all")
      if (isHidden) {
        // If focus mode, strictly hidden (no opacity override needed as hidden=true handles it)
        if (focusModeNode) {
          // Ensure no residual visual artifacts
          graph.setNodeAttribute(node, "size", 0);
        } else {
          // For standard filters, maybe we want faint ghosts?
          // Current logic sets hidden=true, so they are gone anyway.
          // If we wanted dimming, we would set hidden=false and color=faint.
          // For now, sticking to strict hiding for filters too as per standard Sigma behavior.
        }
      } else {
        const isSolid = solidNodes?.has(node);
        // Logic: if in solidNodes, IT IS SOLID, override any 'ghost' status.
        // If not in solidNodes, respect the attribute status.
        const isGhost = !isSolid && attrs.status === "ghost";

        graph.setNodeAttribute(
          node,
          "color",
          attrs.controversyScore > 0 && !attrs.hidden
            ? COLORS.CONTRADICTS // Red for controversial
            : isGhost
              ? `${attrs.color}${COLORS.GHOST_ALPHA}` // 25% opacity for ghost
              : attrs.originalColor ||
                COLORS.CLUSTERS[attrs.cluster] ||
                COLORS.CLUSTERS[0],
        );

        // Update status attribute in graph for other components (tooltip etc) to see
        if (isSolid && attrs.status !== "solid") {
          graph.setNodeAttribute(node, "status", "solid");
        }

        // Explicit visual cue for ghost (e.g. outline or desaturated)?
        // For now, simpler visual cue: Low opacity color
        // And reset size
        graph.setNodeAttribute(
          node,
          "size",
          attrs.originalSize || attrs.size || GRAPH.DEFAULT_NODE_SIZE,
        );
      }
    });

    // Update edge visibility
    graph.forEachEdge((edge, attrs) => {
      const isHidden = effectiveHiddenEdges.has(edge);
      graph.setEdgeAttribute(edge, "hidden", isHidden);
      if (isHidden) {
        graph.setEdgeAttribute(edge, "color", "rgba(100, 100, 100, 0.05)");
        graph.setEdgeAttribute(edge, "size", 0.1);
      } else {
        graph.setEdgeAttribute(edge, "color", attrs.originalColor || "#e5e7eb");
        graph.setEdgeAttribute(edge, "size", attrs.originalSize || 1);
      }
    });

    // Report filtering stats
    if (onFilterStatsChange) {
      onFilterStatsChange({
        hiddenNodes: effectiveHiddenNodes.size,
        hiddenEdges: effectiveHiddenEdges.size,
      });
    }

    // Only refresh ONCE after all updates
    sigma.refresh();
  }, [
    filters,
    sigma,
    onFilterStatsChange,
    refreshTrigger,
    focusModeNode,
    solidNodes,
  ]);

  // Register Interaction API
  useEffect(() => {
    if (!onRegisterInteractionApi) return;

    const api: CanvasInteractionApi = {
      focusNodes: (nodeIds: string[]) => {
        const graph = sigma.getGraph();
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        let foundNode = false;

        nodeIds.forEach((nodeId: string) => {
          // Use display data for safer visual coordinates
          const data = sigma.getNodeDisplayData(nodeId);
          if (!data) return;

          const x = data.x || 0;
          const y = data.y || 0;

          if (typeof x !== "number" || typeof y !== "number") return;

          foundNode = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        });

        if (!foundNode || minX === Infinity) return;

        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;

        // Sanity check
        if (isNaN(cx) || isNaN(cy)) return;

        sigma
          .getCamera()
          .animate(
            { x: cx, y: cy, ratio: GRAPH.CAMERA_ZOOM_RATIO, angle: 0 },
            { duration: ANIMATION.CAMERA_DURATION_SLOW },
          );
      },

      exportSelection: (nodeIds: string[]) => {
        const graph = sigma.getGraph();
        const data = nodeIds
          .map((id: string) => {
            // Fallback to checking existence
            if (!graph.hasNode(id)) return null;
            const attrs = graph.getNodeAttributes(id);

            // Map attributes safely
            return {
              id: attrs.paperId || attrs.id || id, // Fallback chain
              title: attrs.title || "Untitled",
              authors: attrs.authors || "Unknown",
              year: attrs.year || "",
              citations: attrs.citations || 0,
            };
          })
          .filter(Boolean);

        if (data.length === 0) {
          debug.warn(
            "Export failed: No valid nodes found in selection",
            nodeIds,
          );
          return;
        }

        const csvContent =
          "data:text/csv;charset=utf-8," +
          "ID,Title,Authors,Year,Citations\n" +
          data
            .map(
              (
                row: {
                  id: string;
                  title: string;
                  authors: string;
                  year: number | string;
                  citations: number;
                } | null,
              ) =>
                `"${row?.id}","${row?.title}","${row?.authors}",${row?.year},${row?.citations}`,
            )
            .join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
          "download",
          `selection_export_${new Date().getTime()}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },

      findPaths: (
        sourceId: string,
        targetId: string,
        mode: PathMode = "shortest",
      ) => {
        return findSemanticPath(sigma.getGraph(), sourceId, targetId, mode);
      },

      clearHighlights: () => {
        // Clear any highlighted paths or nodes
        const graph = sigma.getGraph();
        graph.forEachNode((node, attrs) => {
          if (attrs.originalColor) {
            graph.setNodeAttribute(node, "color", attrs.originalColor);
          }
        });
        sigma.refresh();
      },

      expandNode: async (nodeId: string, direction: "in" | "out") => {
        const graph = sigma.getGraph();
        if (!graph.hasNode(nodeId)) return;

        // Visual feedback - maybe spin the node or show a toast

        try {
          const { nodes: newNodes, edges: newEdges } =
            await graphAPI.expandNode(nodeId, direction);

          let addedCount = 0;

          // Merge nodes
          newNodes.forEach((node) => {
            if (!graph.hasNode(node.id)) {
              graph.addNode(node.id, {
                ...node,
                originalSize: node.size,
                hidden: false,
                // Start small for animation
                size: 0,
                x: node.x, // graphAPI provides initial position near parent
                y: node.y,
              });

              // Animate size up
              // We can't easily animate individual props in sigma via API, but we can set them
              // and let the loop handle it or just set them directly
              graph.setNodeAttribute(node.id, "size", node.size);
              addedCount++;
            }
          });

          // Merge edges
          newEdges.forEach((edge) => {
            if (!graph.hasEdge(edge.id)) {
              graph.mergeEdgeWithKey(edge.id, edge.source, edge.target, {
                ...edge,
                originalColor: edge.color,
                hidden: false,
              });
            }
          });

          if (addedCount > 0) {
            onStatsChange({
              nodeCount: graph.order,
              edgeCount: graph.size,
            });
            // Trigger re-layout if we had one?
            // Ideally we just place them near and let the user decide, or run a small layout burst
            // forcing a refresh
            sigma.refresh();
          }
        } catch (e) {
          debug.error("Expansion failed", e);
        }
      },
      addGraphData: (nodes: PaperNode[], edges: EdgeData[], clear = false) => {
        const graph = sigma.getGraph();
        if (clear) graph.clear();

        let addedCount = 0;

        nodes.forEach((node: PaperNode) => {
          if (!graph.hasNode(node.id)) {
            graph.addNode(node.id, {
              ...node,
              hidden: false,
              // If focusing on a new slice, maybe force position if provided, else use layout
              x: node.x || Math.random() * 100,
              y: node.y || Math.random() * 100,
              size: node.size || GRAPH.DEFAULT_NODE_SIZE,
              color: node.color,
            });
            addedCount++;
          }
        });

        edges.forEach((edge: EdgeData) => {
          if (
            !graph.hasEdge(edge.id) &&
            graph.hasNode(edge.source) &&
            graph.hasNode(edge.target)
          ) {
            graph.mergeEdgeWithKey(edge.id, edge.source, edge.target, {
              ...edge,
              hidden: false,
              size: edge.size || GRAPH.DEFAULT_EDGE_SIZE,
              color: edge.color,
            });
          }
        });

        if (addedCount > 0 || clear) {
          onStatsChange({
            nodeCount: graph.order,
            edgeCount: graph.size,
          });
          sigma.refresh();

          // If clearing, reset camera potentially?
          if (clear) {
            // simple layout/zoom
            // sigma.getCamera().animatedReset();
          }
        }
      },
    };

    onRegisterInteractionApi(api);
  }, [sigma, onRegisterInteractionApi, onStatsChange]);

  // Set up event handlers
  useEffect(() => {
    registerEvents({
      enterNode: (event) => setHoveredNode(event.node),
      leaveNode: () => setHoveredNode(null),
      clickNode: async (event) => {
        const attrs = sigma.getGraph().getNodeAttributes(event.node);

        // If in selection mode, add node to selection
        if (selectionMode && onNodeSelect) {
          onNodeSelect(event.node, attrs.title || attrs.label || event.node);
          return;
        }

        // Get real paper data from the graph
        const paperData: PaperData = {
          id: attrs.paperId || `#${event.node}`,
          title: attrs.title || attrs.label,
          authors: attrs.authors || "Unknown Authors",
          year: attrs.year || 2024,
          venue: attrs.venue,
          arxivId: attrs.arxivId,
          citations: attrs.citations || 0,
          references: attrs.references || 0,
          supports: attrs.supports || 0,
          refutes: attrs.refutes || 0,
          abstract: attrs.abstract,
          aiSummary: attrs.aiSummary,
          status: attrs.status,
        };

        // Fetch evidence from API
        const evidence = await graphAPI.getEvidence(event.node);

        onNodeClick(paperData, evidence);
      },
      clickEdge: (event) => {
        if (!onEdgeClick) return;

        const graph = sigma.getGraph();
        const attrs = graph.getEdgeAttributes(event.edge);
        const sourceAttrs = graph.getNodeAttributes(graph.source(event.edge));
        const targetAttrs = graph.getNodeAttributes(graph.target(event.edge));

        // Mock edge evidence for now (since API might not have it yet)
        const type = (attrs.edgeType || "supports") as
          | "supports"
          | "contradicts"
          | "extends";

        const SNIPPETS = [
          {
            text: "...contrary to the findings of [Source], we observe significant deviation...",
            context: "Results",
            type: "contradicts",
          },
          {
            text: "...our method builds on the architecture proposed by [Source]...",
            context: "Methodology",
            type: "extends",
          },
          {
            text: "...this validates the initial hypothesis presented in [Target]...",
            context: "Discussion",
            type: "supports",
          },
          {
            text: "...however, unlike the approach in [Target], we do not rely on...",
            context: "Introduction",
            type: "contradicts",
          },
        ] as const;

        const match = SNIPPETS.find((s) => s.type === type) || SNIPPETS[0];

        const evidence: EdgeEvidence = {
          id: event.edge,
          edgeType: type,
          confidence: attrs.confidence || 85,
          sourcePaper: {
            id: graph.source(event.edge),
            title: sourceAttrs.title || sourceAttrs.label || "Source Paper",
            authors: sourceAttrs.authors || "Unknown",
            year: sourceAttrs.year || 2024,
          },
          targetPaper: {
            id: graph.target(event.edge),
            title: targetAttrs.title || targetAttrs.label || "Target Paper",
            authors: targetAttrs.authors || "Unknown",
            year: targetAttrs.year || 2024,
          },
          snippets: [
            {
              text: match.text,
              source: `Section ${Math.floor(Math.random() * 5) + 1}, p. ${Math.floor(Math.random() * 20) + 1}`,
              context: match.context,
            },
          ],
        };

        // Get payload position (screen coordinates)
        // @ts-ignore - position exists in event payload
        const { x, y } = event.event.original;

        onEdgeClick(event.edge, { x, y }, evidence);
      },
    });
  }, [
    registerEvents,
    sigma,
    onNodeClick,
    onNodeSelect,
    onEdgeClick,
    selectionMode,
  ]);

  // Register Export Function
  useEffect(() => {
    if (!onRegisterExport) return;

    const exportGraph = async (): Promise<string> => {
      // Get all Sigma canvases
      const canvases = sigma.getCanvases() as unknown as Record<
        string,
        HTMLCanvasElement
      >;
      const canvasList = Object.values(canvases);

      if (canvasList.length === 0) return "";

      // Create a composite canvas
      const width = canvasList[0].width;
      const height = canvasList[0].height;

      const composite = document.createElement("canvas");
      composite.width = width;
      composite.height = height;
      const ctx = composite.getContext("2d");

      if (!ctx) return "";

      // Fill background (dark mode detection handled by checking theme if passed, or default to current canvas style)
      // Since we don't know theme here easily without prop, we'll assume transparent or match canvas container color
      // But let's check global theme
      const isDark = document.documentElement.classList.contains("dark");
      ctx.fillStyle = isDark ? "#0B0C10" : "#F6F7F8";
      ctx.fillRect(0, 0, width, height);

      // Draw layers in order (scene, edges, nodes, labels usually)
      // Sigma v3 canvases are typically: scene, mouse, other layers
      // We'll just draw all we find
      canvasList.forEach((canvas) => {
        ctx.drawImage(canvas, 0, 0);
      });

      return composite.toDataURL("image/png");
    };

    onRegisterExport(exportGraph);
  }, [sigma, onRegisterExport]);

  // Register Reset Function
  useEffect(() => {
    if (!onRegisterReset) return;

    const resetView = () => {
      sigma.getCamera().animatedReset({ duration: 600 });
    };

    onRegisterReset(resetView);
  }, [sigma, onRegisterReset]);

  // Apply focus to specific node
  useEffect(() => {
    if (!focusNode) return;

    const graph = sigma.getGraph();
    if (!graph.hasNode(focusNode)) {
      debug.warn(`Node ${focusNode} not found`);
      return;
    }

    const nodePosition = sigma.getNodeDisplayData(focusNode);
    if (nodePosition) {
      sigma.getCamera().animate(
        {
          x: nodePosition.x,
          y: nodePosition.y,
          ratio: GRAPH.FOCUS_ZOOM_RATIO,
          angle: 0,
        },
        { duration: ANIMATION.CAMERA_DURATION },
      );
    }
  }, [focusNode, sigma]);

  // Apply hover effects
  useEffect(() => {
    const graph = sigma.getGraph();
    if (!graph || graph.order === 0) return;

    // Track which edges are connected to hovered node for flow animation
    const connectedEdges = new Set<string>();

    graph.forEachNode((node, attrs) => {
      if (attrs.hidden) return; // Skip hidden nodes

      if (hoveredNode) {
        if (node === hoveredNode) {
          graph.setNodeAttribute(
            node,
            "size",
            (attrs.originalSize || attrs.size) * GRAPH.HOVER_SIZE_MULTIPLIER,
          );
          graph.setNodeAttribute(node, "zIndex", GRAPH.HIGHLIGHT_Z_INDEX);
        } else {
          graph.setNodeAttribute(
            node,
            "size",
            (attrs.originalSize || attrs.size) * GRAPH.UNHOVER_SIZE_MULTIPLIER,
          );
        }
      } else {
        graph.setNodeAttribute(node, "size", attrs.originalSize || attrs.size);
        graph.setNodeAttribute(node, "zIndex", 0);
      }
    });

    graph.forEachEdge((edge, attrs, source, target) => {
      if (attrs.hidden) return; // Skip hidden edges

      if (hoveredNode) {
        if (source === hoveredNode || target === hoveredNode) {
          // Add to connected edges for flow animation
          connectedEdges.add(edge);

          graph.setEdgeAttribute(
            edge,
            "size",
            (attrs.originalSize || GRAPH.DEFAULT_EDGE_SIZE) *
              GRAPH.HOVER_EDGE_SIZE_MULTIPLIER,
          );
          graph.setEdgeAttribute(edge, "zIndex", GRAPH.HIGHLIGHT_Z_INDEX);
        } else {
          graph.setEdgeAttribute(edge, "size", GRAPH.UNHOVER_EDGE_SIZE);
          graph.setEdgeAttribute(edge, "zIndex", 0);
        }
      } else {
        graph.setEdgeAttribute(
          edge,
          "size",
          attrs.originalSize || GRAPH.DEFAULT_EDGE_SIZE,
        );
        graph.setEdgeAttribute(edge, "zIndex", 0);
      }
    });

    // Update hovered edges state for flow animation
    setHoveredEdges(connectedEdges);

    sigma.refresh();
  }, [hoveredNode, sigma]);

  // Enable flowing animation on hovered edges
  useEdgeFlowAnimation({
    enabled: true,
    hoveredEdges,
  });

  return null;
}
