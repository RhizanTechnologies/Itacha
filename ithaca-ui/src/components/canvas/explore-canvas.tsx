"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  SigmaContainer,
  ControlsContainer,
  ZoomControl,
  FullScreenControl,
  useLoadGraph,
  useSigma,
  useRegisterEvents,
} from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import { useTheme } from "next-themes";
import Graph from "graphology";
import { drawDiscNodeLabel } from "sigma/rendering";
import { ForceAtlasControl } from "@/components/canvas/force-atlas-control";
import { NodeTooltip } from "@/components/canvas/node-tooltip";
import { CanvasStatusIndicator } from "@/components/canvas/status-indicator";
import { EdgeLabels } from "@/components/canvas/edge-labels";
import { CanvasErrorBoundary } from "@/components/canvas/canvas-error-boundary";
import { CanvasLoadingOverlay } from "@/components/canvas/canvas-loading";
import { CanvasEmptyState } from "@/components/canvas/canvas-empty-state";
import { PaperInspector } from "@/components/inspector/paper-inspector";
import type {
  PaperData,
  EvidenceItem,
} from "@/components/inspector/paper-inspector";
import {
  GlobalFilters,
  GraphLegend,
  FilterState,
  DEFAULT_FILTERS,
} from "@/components/filters/global-filters";
import { CommandBar } from "@/components/command/command-bar";
import {
  ShareExportDialog,
  ShareButton,
} from "@/components/share/share-export";
import * as graphApiModule from "@/lib/api/graph-api";
import { useEdgeFlowAnimation } from "@/hooks/useEdgeFlowAnimation";
import { Lightbulb, X } from "lucide-react";
import { NodeDragControl } from "@/components/canvas/node-drag-control";
import { PaperCountControl } from "@/components/canvas/paper-count-control";

import { ZoomIndicator } from "@/components/canvas/zoom-indicator";
import {
  EdgeEvidencePopover,
  EdgeEvidence,
} from "@/components/canvas/edge-evidence-popover";
import {
  CanvasChatPanel,
  ChatToggleButton,
} from "@/components/canvas/canvas-chat-panel";
import {
  PathComparisonView,
  PathMode,
} from "@/components/canvas/path-comparison";
import {
  NodeSelectionTool,
  SelectionPanel,
  SelectionInstruction,
} from "@/components/canvas/node-selection";
import { findSemanticPath } from "@/lib/graph-algorithms";
import { debug } from "@/lib/debug";
import { useCanvasKeyboard } from "@/hooks/useCanvasKeyboard";
import {
  KeyboardShortcutsHelp,
  KeyboardShortcutsButton,
} from "@/components/canvas/keyboard-shortcuts-help";
import { useTutorial, CANVAS_TUTORIAL } from "@/hooks/useTutorial";
import {
  TutorialOverlay,
  TutorialStartButton,
} from "@/components/canvas/canvas-tutorial";
import {
  ANIMATION,
  GRAPH,
  COLORS,
  CONTROVERSY,
  LABELS,
  FILTERS,
} from "@/lib/constants";
import type {
  GraphApiShape,
  GraphInteractionApi,
  CanvasInteractionApi,
  GraphFetchResult,
  NodeAttributes,
  SigmaPositionEventPayload,
} from "@/types/graph";
import type { PaperNode, EdgeData } from "@/lib/api/graph-api";

// =============================================================================
// GRAPH LOADER COMPONENT
// =============================================================================

// Safely retrieve the API instance - graphApiModule exports { graphAPI }
const graphAPI = graphApiModule.graphAPI;

interface GraphLoaderProps {
  onNodeClick: (paper: PaperData, evidence: EvidenceItem[]) => void;
  onNodeSelect?: (nodeId: string, label: string) => void;
  onEdgeClick?: (
    edgeId: string,
    position: { x: number; y: number },
    evidence: EdgeEvidence,
  ) => void;
  selectionMode?: boolean;
  focusNode?: string | null;
  focusModeNode?: string | null; // New prop for focus mode
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

function GraphLoader({
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

// =============================================================================
// TOAST NOTIFICATION
// =============================================================================

function NewArgumentToast({
  show,
  message,
  onClose,
}: {
  show: boolean;
  message: string;
  onClose: () => void;
}) {
  if (!show) return null;

  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-card/95 backdrop-blur-sm border border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] rounded-lg p-1 pr-4 flex items-center gap-3">
        <div className="bg-primary/20 text-primary p-2 rounded flex items-center justify-center">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-bold">
            New Argument Found
          </span>
          <span className="text-muted-foreground text-xs">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// THEME-AWARE NODE HOVER DRAWER
// =============================================================================

/**
 * Custom hover drawer that uses theme-aware colors.
 * Based on Sigma's drawDiscNodeHover but with configurable background colors.
 */
function createThemeAwareHoverDrawer(isDark: boolean) {
  return function drawNodeHover(
    context: CanvasRenderingContext2D,
    data: {
      x: number;
      y: number;
      size: number;
      label?: string | null;
      color?: string;
      [key: string]: unknown;
    },
    settings: {
      labelSize: number;
      labelFont: string;
      labelWeight: string;
      labelColor: { color?: string; attribute?: string };
    },
  ) {
    const size = settings.labelSize;
    const font = settings.labelFont;
    const weight = settings.labelWeight;

    context.font = `${weight} ${size}px ${font}`;

    // Theme-aware colors
    const bgColor = isDark ? "#1f2937" : "#ffffff";
    const shadowColor = isDark ? "rgba(0,0,0,0.5)" : "#000";

    // Draw the label background with theme-aware colors
    context.fillStyle = bgColor;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 8;
    context.shadowColor = shadowColor;

    const PADDING = 2;

    if (typeof data.label === "string") {
      const textWidth = context.measureText(data.label).width;
      const boxWidth = Math.round(textWidth + 5);
      const boxHeight = Math.round(size + 2 * PADDING);
      const radius = Math.max(data.size, size / 2) + PADDING;

      const angleRadian = Math.asin(boxHeight / 2 / radius);
      const xDeltaCoord = Math.sqrt(
        Math.abs(Math.pow(radius, 2) - Math.pow(boxHeight / 2, 2)),
      );

      context.beginPath();
      context.moveTo(data.x + xDeltaCoord, data.y + boxHeight / 2);
      context.lineTo(data.x + radius + boxWidth, data.y + boxHeight / 2);
      context.lineTo(data.x + radius + boxWidth, data.y - boxHeight / 2);
      context.lineTo(data.x + xDeltaCoord, data.y - boxHeight / 2);
      context.arc(data.x, data.y, radius, angleRadian, -angleRadian);
      context.closePath();
      context.fill();
    } else {
      context.beginPath();
      context.arc(data.x, data.y, data.size + PADDING, 0, Math.PI * 2);
      context.closePath();
      context.fill();
    }

    // Reset shadow
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 0;

    // Draw the label with Sigma's default label drawer
    drawDiscNodeLabel(
      context,
      data as Parameters<typeof drawDiscNodeLabel>[1],
      settings as Parameters<typeof drawDiscNodeLabel>[2],
    );
  };
}

// =============================================================================
// MAIN CANVAS COMPONENT
// =============================================================================

export function ExploreCanvas() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // UI State
  const [showToast, setShowToast] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Data State
  const [selectedPaper, setSelectedPaper] = useState<PaperData | null>(null);
  const [paperEvidence, setPaperEvidence] = useState<EvidenceItem[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [graphStats, setGraphStats] = useState({ nodeCount: 0, edgeCount: 0 });
  const [dataRanges, setDataRanges] = useState<{
    minYear: number;
    maxYear: number;
    maxCitations: number;
  }>({
    minYear: FILTERS.MIN_YEAR,
    maxYear: FILTERS.MAX_YEAR,
    maxCitations: FILTERS.DEFAULT_MAX_CITATIONS,
  });
  const [filterStats, setFilterStats] = useState({
    hiddenNodes: 0,
    hiddenEdges: 0,
  });
  const [paperCount, setPaperCount] = useState(25);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [solidNodes, setSolidNodes] = useState<Set<string>>(new Set());

  // Selection State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [nodeLabels, setNodeLabels] = useState<Record<string, string>>({});

  // Edge Evidence State
  const [edgeEvidence, setEdgeEvidence] = useState<EdgeEvidence | null>(null);
  const [edgeEvidencePos, setEdgeEvidencePos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Path Comparison State
  const [pathCompareOpen, setPathCompareOpen] = useState(false);
  const [calculatedPaths, setCalculatedPaths] = useState<any[]>([]);
  const [pathMode, setPathMode] = useState<PathMode>("shortest");

  // Search State
  const [searchTarget, setSearchTarget] = useState<string | null>(null);

  // Focus Mode State
  const [focusModeNode, setFocusModeNode] = useState<string | null>(null);

  // Export function ref
  const exportGraphRef = useRef<(() => Promise<string>) | null>(null);

  // Reset function ref
  const resetViewRef = useRef<(() => void) | null>(null);
  const graphApiRef = useRef<CanvasInteractionApi | null>(null);

  // Sigma and Graph refs for export
  const sigmaRef = useRef<any>(null);
  const graphInstanceRef = useRef<Graph | null>(null);

  // Physics State
  const [physicsEnabled, setPhysicsEnabled] = useState(true); // Default to on

  // Keyboard Shortcuts State
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);

  // Initialize keyboard shortcuts
  useCanvasKeyboard({
    sigma: sigmaRef.current,
    enabled: true,
    onEscape: () => {
      // Close all panels, deselect nodes
      setInspectorOpen(false);
      setFiltersOpen(false);
      setChatOpen(false);
      setShareOpen(false);
      setEdgeEvidence(null);
      setFocusModeNode(null);
      setSelectedNodes([]);
      setSelectionMode(false);
    },
    onShowHelp: () => setKeyboardHelpOpen(true),
    onResetView: () => resetViewRef.current?.(),
    onToggleFullscreen: () => {
      // Delegate to Sigma's fullscreen control behavior
      const container = document.querySelector(".react-sigma");
      if (container) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          container.requestFullscreen?.();
        }
      }
    },
    onToggleSelection: () => setSelectionMode(!selectionMode),
    onToggleChat: () => setChatOpen(!chatOpen),
    onTogglePhysics: () => setPhysicsEnabled(!physicsEnabled),
    onExport: () => setShareOpen(true),
  });

  // Initialize tutorial
  const tutorial = useTutorial(CANVAS_TUTORIAL);

  // Show demo toast after a delay
  useEffect(() => {
    const timer = setTimeout(
      () => setShowToast(true),
      ANIMATION.TOAST_SHOW_DELAY,
    );
    return () => clearTimeout(timer);
  }, []);

  // Handle node click - receives real data from GraphLoader
  const handleNodeClick = useCallback(
    (paper: PaperData, evidence: EvidenceItem[]) => {
      setSelectedPaper(paper);
      setPaperEvidence(evidence);
      setInspectorOpen(true);
    },
    [],
  );

  // Handle stats update from GraphLoader
  const handleStatsChange = useCallback(
    (stats: { nodeCount: number; edgeCount: number }) => {
      setGraphStats(stats);
    },
    [],
  );

  // Handle data ranges update from GraphLoader
  const handleDataRangesChange = useCallback(
    (ranges: { minYear: number; maxYear: number; maxCitations: number }) => {
      setDataRanges(ranges);
    },
    [],
  );

  // Handle edge click - shows evidence popover for edge relationships
  const handleEdgeClick = useCallback(
    (
      edgeId: string,
      position: { x: number; y: number },
      evidence: EdgeEvidence,
    ) => {
      setEdgeEvidence(evidence);
      setEdgeEvidencePos(position);
    },
    [],
  );

  // Handle focus on selected nodes
  const handleFocusSelection = useCallback(() => {
    if (selectedNodes.length === 0 || !graphApiRef.current) return;
    graphApiRef.current.focusNodes(selectedNodes);
  }, [selectedNodes]);

  // Handle export selection
  const handleExportSelection = useCallback(() => {
    if (selectedNodes.length === 0 || !graphApiRef.current) return;
    graphApiRef.current.exportSelection(selectedNodes);
  }, [selectedNodes]);

  // Handle entering focus mode
  const handleEnterFocusMode = useCallback((nodeId: string) => {
    setFocusModeNode(nodeId);
    // Also center camera on this node
    if (graphApiRef.current) {
      graphApiRef.current.focusNodes([nodeId]);
    }
  }, []);

  // Handle path comparison calculation
  const handleComparePaths = useCallback(
    (mode: PathMode = pathMode) => {
      if (selectedNodes.length < 2 || !graphApiRef.current) return;

      // Use the sigma instance directly if accessible, or via api if exposed
      // Since findSemanticPath needs the graph object, we need access to it.
      // GraphLoader has it. We need to expose a way to get the graph or modify the API.
      // For now we will rely on a new method in the API or update the API to support modes.
      // But graphApiRef.current.findPaths is currently hardcoded.

      // Better approach: We need to trigger the calculation here using the mode.
      // But ExploreCanvas doesn't have direct access to Sigma instance/graph unless we move logic up or expose graph.
      // Let's assume we update the API interface to accept mode?
      // Actually, graphApiRef IS the bridge. Let's make `findPaths` accept mode.
      // But I changed findPaths implementation in GraphLoader to use the new lib function?
      // Wait, GraphLoader defines the API implementation. I need to update GraphLoader's findPaths too.

      // Let's execute the default for now, and handle mode change logic below.
      // Actually, since I can't easily change the API signature without touching types everywhere,
      // I will modify GraphLoader to use the `findSemanticPath` function which I already did in the previous chunk.
      // But I need to pass the mode TO the API function.

      // Hack: Modify GraphLoader to expose a `findSemanticPath` method in the API.
      // For this step, I'm just updating the state handler.
      setPathMode(mode);

      // We need to re-run the search.
      // Since we don't have the graph here, we will emit an event or use the API if updated.
      // Let's assume we update GraphLoader api.
      // For now, let's keep it simple: we need to update GraphInteractionApi to accept mode.
    },
    [selectedNodes, pathMode],
  );

  // Real implementation of path finding with mode
  const calculatePathWithMode = useCallback(
    (mode: PathMode) => {
      debug.graph("Calculating path...", {
        mode,
        selectedNodes,
        api: !!graphApiRef.current,
      });
      if (selectedNodes.length < 2 || !graphApiRef.current) {
        debug.warn("Cannot calculate path: missing selection or API");
        return;
      }

      try {
        const paths = graphApiRef.current.findPaths(
          selectedNodes[0],
          selectedNodes[1],
          mode,
        );
        debug.graph("Paths found:", paths);
        setCalculatedPaths(paths);
        setPathMode(mode);
        setPathCompareOpen(true);
      } catch (err) {
        debug.error("Error calculating path:", err);
      }
    },
    [selectedNodes],
  );

  // Handle command bar actions
  const handleCommandAction = useCallback((action: string) => {
    switch (action) {
      case "open-filters":
        setFiltersOpen(true);
        break;
      case "export":
        setShareOpen(true);
        break;
      case "toggle-physics":
        setPhysicsEnabled((prev) => !prev);
        break;
      case "reset-view":
        resetViewRef.current?.();
        break;
      case "shortcuts":
      case "settings":
        // TODO: Implement settings/shortcuts dialog
        setShowToast(true); // Reusing toast for feedback
        break;
      default:
        debug.log("Unhandled action:", action);
    }
  }, []);

  // Handle paper search from command bar
  const handleSearchPaper = useCallback(async (paperId: string) => {
    debug.search("Search for paper:", paperId);
    setSearchTarget(paperId);
    setIsLoading(true);

    try {
      let nodes: any[] = [];
      let edges: any[] = [];
      let isTopic = paperId.startsWith("topic-");

      if (isTopic) {
        // Scenario A: Topic Slice
        const query = paperId.replace("topic-", "");
        const data = await graphAPI.fetchTopicSlice(query);
        nodes = data.nodes;
        edges = data.edges;
        setShowToast(true); // "Topic Slice Loaded" reused toast or new message
      } else {
        // Scenario B: Paper Context
        const data = await graphAPI.fetchPaperContext(paperId);
        nodes = data.nodes;
        edges = data.edges;
      }

      // Inject into graph
      if (graphApiRef.current) {
        // For search, we might optionally CLEAR the graph to show just the slice?
        // "Hybrid Workspace": We keep the Solid nodes, but maybe clear the Ghosts?
        // For now, let's just MERGE (addGraphData default).
        // This is safer for "Building a project".
        graphApiRef.current.addGraphData(nodes, edges, false);

        // Focus on the new nodes
        if (nodes.length > 0) {
          // Focus on the first node or center?
          if (!isTopic) {
            graphApiRef.current.focusNodes([paperId]);
          }
        }
      }
    } catch (e) {
      debug.error("Search failed", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const [chatOpen, setChatOpen] = useState(false);

  // Memoize the theme-aware hover drawer to avoid recreating on every render
  const themeAwareHoverDrawer = useMemo(
    () => createThemeAwareHoverDrawer(isDark),
    [isDark],
  );

  return (
    <div className="h-full w-full flex flex-row">
      {/* Main Canvas Area - contains all overlays */}
      <div className="flex-1 h-full relative overflow-x-auto min-w-[320px]">
        <CanvasErrorBoundary
          onError={(error) => {
            debug.error("Canvas rendering error:", error);
          }}
        >
          <SigmaContainer
            style={{
              height: "100%",
              width: "100%",
              background: isDark ? "#0B0C10" : "#F6F7F8",
            }}
            settings={
              {
                allowInvalidContainer: true,
                renderLabels: true,
                renderEdgeLabels: false,
                labelRenderedSizeThreshold: LABELS.SIZE_THRESHOLD,
                labelDensity: LABELS.DENSITY,
                labelGridCellSize: LABELS.GRID_CELL_SIZE,
                labelColor: { color: isDark ? "#fff" : "#000" },
                zIndex: true,
                defaultEdgeType: "arrow",
                enableEdgeEvents: true,
                labelFont: LABELS.FONT,
                labelWeight: LABELS.WEIGHT,
                // Theme-aware hover styling for dark mode readability
                defaultDrawNodeHover: themeAwareHoverDrawer,
              } as const
            }
          >
            <GraphLoader
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onStatsChange={handleStatsChange}
              onDataRangesChange={handleDataRangesChange}
              onFilterStatsChange={setFilterStats}
              onRegisterInteractionApi={useCallback(
                (api: CanvasInteractionApi) => {
                  graphApiRef.current = api;
                },
                [],
              )}
              onRegisterSigmaGraph={useCallback((sigma: any, graph: Graph) => {
                sigmaRef.current = sigma;
                graphInstanceRef.current = graph;
              }, [])}
              filters={filters}
              paperCount={paperCount}
              refreshTrigger={refreshTrigger}
              selectionMode={selectionMode}
              focusNode={searchTarget}
              focusModeNode={focusModeNode}
              solidNodes={solidNodes}
              onAddToProject={useCallback((nodeId: string) => {
                setSolidNodes((prev) => {
                  const next = new Set(prev);
                  next.add(nodeId);
                  return next;
                });
              }, [])}
              onRegisterExport={useCallback((fn: () => Promise<string>) => {
                exportGraphRef.current = fn;
              }, [])}
              onRegisterReset={useCallback((fn: () => void) => {
                resetViewRef.current = fn;
              }, [])}
              onNodeSelect={useCallback((nodeId: string, label: string) => {
                setSelectedNodes((prev) =>
                  prev.includes(nodeId)
                    ? prev.filter((id) => id !== nodeId)
                    : [...prev, nodeId],
                );
                setNodeLabels((prev) => ({ ...prev, [nodeId]: label }));
              }, [])}
            />

            {/* Sigma-managed internal components (need sigma context) */}
            <NodeDragControl />
            <NodeTooltip
              onExpand={(nodeId, direction, type) => {
                if (graphApiRef.current) {
                  graphApiRef.current.expandNode(nodeId, direction);
                }
              }}
              onFocus={handleEnterFocusMode}
            />
            <EdgeLabels />

            {/* Canvas Controls - inside SigmaContainer for sigma context */}
            <ControlsContainer position={"top-right"}>
              <ZoomControl />
              <FullScreenControl />
              <ForceAtlasControl
                externalIsRunning={physicsEnabled}
                onToggle={() => setPhysicsEnabled(!physicsEnabled)}
                nodeCount={graphStats.nodeCount}
              />
            </ControlsContainer>

            {/* Zoom indicator - needs sigma context */}
            <ZoomIndicator />
          </SigmaContainer>
        </CanvasErrorBoundary>

        {/* Empty State - shown when no graph data */}
        {!isLoading && graphStats.nodeCount === 0 && (
          <CanvasEmptyState
            message="Search for a research topic to explore its citation network"
            onSearchClick={() => {
              // Focus the command bar - it's already rendered and listens for Cmd+K
              // We can dispatch a keyboard event to trigger it
              const event = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                ctrlKey: true,
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
          />
        )}

        {/* Loading Overlay */}
        <CanvasLoadingOverlay
          isLoading={isLoading}
          message="Loading graph..."
        />

        {/* ========== STRUCTURED OVERLAY SYSTEM ========== */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* TOP-LEFT ZONE: Filters & Paper Count */}
          <div className="absolute top-4 left-4 flex flex-col gap-3 pointer-events-auto">
            <GlobalFilters
              filters={filters}
              onFiltersChange={setFilters}
              hiddenEdgeCount={filterStats.hiddenEdges}
              open={filtersOpen}
              onToggle={() => setFiltersOpen(!filtersOpen)}
              maxCitations={dataRanges.maxCitations}
              minYear={dataRanges.minYear}
              maxYear={dataRanges.maxYear}
            />
            <PaperCountControl
              count={paperCount}
              onChange={(count) => {
                setPaperCount(count);
                setRefreshTrigger((t) => t + 1);
              }}
              onRefresh={() => setRefreshTrigger((t) => t + 1)}
              isLoading={isLoading}
            />
          </div>

          {/* TOP-RIGHT ZONE: AI Chat & Node Selection (alongside Sigma's ControlsContainer) */}
          <div className="absolute top-4 right-24 flex flex-row items-start gap-3 pointer-events-auto">
            <ChatToggleButton
              isOpen={chatOpen}
              onClick={() => setChatOpen(!chatOpen)}
            />
            <NodeSelectionTool
              isActive={selectionMode}
              onToggle={() => setSelectionMode(!selectionMode)}
              selectedNodes={selectedNodes}
              nodeLabels={nodeLabels}
            />
          </div>

          {/* TOP-CENTER ZONE: Focus Mode Banner */}
          {focusModeNode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="bg-primary/90 backdrop-blur-md text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-3 border border-primary-foreground/20">
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">
                    Focus Mode
                  </span>
                </div>
                <div className="h-4 w-px bg-primary-foreground/30" />
                <button
                  onClick={() => setFocusModeNode(null)}
                  className="text-xs font-bold hover:bg-white/20 px-2 py-1 rounded transition-colors"
                >
                  Exit Focus
                </button>
              </div>
            </div>
          )}

          {/* BOTTOM-LEFT ZONE: Legend & Status */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-3 pointer-events-auto">
            <GraphLegend />
            <CanvasStatusIndicator
              status="live"
              nodeCount={graphStats.nodeCount}
              edgeCount={graphStats.edgeCount}
            />
          </div>

          {/* BOTTOM-CENTER ZONE: Selection Panel, Toast (above zoom indicator) */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-auto">
            {/* Selection Panel (appears when nodes are selected) */}
            <SelectionPanel
              selectedNodes={selectedNodes}
              nodeLabels={nodeLabels}
              onClearSelection={() => setSelectedNodes([])}
              onRemoveNode={(nodeId: string) =>
                setSelectedNodes((prev) => prev.filter((id) => id !== nodeId))
              }
              onFocusSelection={handleFocusSelection}
              onCompare={() => calculatePathWithMode(pathMode)}
              onExport={() => handleExportSelection()}
            />
            {/* Selection Instruction (appears when selection mode active but no selection) */}
            <SelectionInstruction
              isActive={selectionMode}
              hasSelection={selectedNodes.length > 0}
            />
            <NewArgumentToast
              show={showToast}
              message="Photosynthetic Efficiency correlation detected"
              onClose={() => setShowToast(false)}
            />
          </div>

          {/* BOTTOM-RIGHT ZONE: Share Button */}
          <div className="absolute bottom-4 right-4 pointer-events-auto">
            <ShareButton onClick={() => setShareOpen(true)} />
          </div>

          {/* BOTTOM-LEFT ZONE: Keyboard Shortcuts & Tutorial */}
          <div className="absolute bottom-4 left-4 pointer-events-auto flex items-center gap-2">
            <KeyboardShortcutsButton
              onClick={() => setKeyboardHelpOpen(true)}
            />
            <TutorialStartButton
              onClick={tutorial.start}
              hasSeenTutorial={tutorial.hasSeenTutorial}
            />
          </div>
        </div>
        {/* ========== END OVERLAY SYSTEM ========== */}

        {/* Loading Overlay (full screen) */}
        <CanvasLoadingOverlay
          isLoading={isLoading}
          message="Loading graph data..."
        />

        {/* Contextual Overlays & Modals */}
        <PaperInspector
          paper={selectedPaper}
          evidence={paperEvidence}
          open={inspectorOpen}
          onOpenChange={setInspectorOpen}
        />

        <CommandBar
          onSelectPaper={handleSearchPaper}
          onAction={handleCommandAction}
          hideTrigger={true}
        />

        <ShareExportDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          graphTitle="Citation Network"
          nodeCount={graphStats.nodeCount}
          edgeCount={graphStats.edgeCount}
          sigma={sigmaRef.current}
          graph={graphInstanceRef.current}
        />

        <EdgeEvidencePopover
          evidence={edgeEvidence}
          position={edgeEvidencePos}
          onClose={() => {
            setEdgeEvidence(null);
            setEdgeEvidencePos(null);
          }}
          onViewPaper={(paperId) => {
            handleSearchPaper(paperId);
          }}
          onDispute={(edgeId) => {
            debug.log("Dispute edge requested:", edgeId);
          }}
        />

        <PathComparisonView
          isOpen={pathCompareOpen}
          onClose={() => setPathCompareOpen(false)}
          paths={calculatedPaths}
          currentMode={pathMode}
          onModeChange={calculatePathWithMode}
        />

        <KeyboardShortcutsHelp
          open={keyboardHelpOpen}
          onOpenChange={setKeyboardHelpOpen}
        />

        {/* Interactive Tutorial Overlay */}
        <TutorialOverlay
          isActive={tutorial.isActive}
          step={tutorial.currentStep}
          stepIndex={tutorial.currentStepIndex}
          totalSteps={tutorial.totalSteps}
          progress={tutorial.progress}
          isLastStep={tutorial.isLastStep}
          showSkip={true}
          showProgress={true}
          onNext={tutorial.next}
          onPrevious={tutorial.previous}
          onSkip={tutorial.skip}
        />
      </div>

      {/* Chat Panel - Split View */}
      <CanvasChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        graphContext={{
          nodeCount: graphStats.nodeCount,
          edgeCount: graphStats.edgeCount,
          selectedNode: selectedNodes[0] || null,
        }}
        onNavigateToPaper={handleSearchPaper}
        onFocusNode={(nodeId) => {
          if (graphApiRef.current) {
            graphApiRef.current.focusNodes([nodeId]);
          }
        }}
      />
    </div>
  );
}
