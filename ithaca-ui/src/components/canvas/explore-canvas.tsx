"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import { ForceAtlasControl } from "@/components/canvas/force-atlas-control";
import { NodeTooltip } from "@/components/canvas/node-tooltip";
import { CanvasStatusIndicator } from "@/components/canvas/status-indicator";
import { EdgeLabels } from "@/components/canvas/edge-labels";
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
import { graphAPI, PaperNode } from "@/lib/api/graph-api";
import { Lightbulb, X } from "lucide-react";
import { NodeDragControl } from "@/components/canvas/node-drag-control";
import { PaperCountControl } from "@/components/canvas/paper-count-control";
import { SearchControl } from "@/components/canvas/search-control";
import { ZoomIndicator } from "@/components/canvas/zoom-indicator";
// =============================================================================
// GRAPH LOADER COMPONENT
// =============================================================================

// import { NodeSelectionTool } from "@/components/canvas/node-selection";
import {
  EdgeEvidencePopover,
  EdgeEvidence,
} from "@/components/canvas/edge-evidence-popover";
import {
  PathComparisonView,
  PathComparisonButton,
} from "@/components/canvas/path-comparison";
import { NodeSelectionTool } from "./node-selection";

// Graph Interaction API definition
interface GraphInteractionApi {
  focusNodes: (nodeIds: string[]) => void;
  exportSelection: (nodeIds: string[]) => void;
  findPaths: (sourceId: string, targetId: string) => any[];
}

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
  onStatsChange: (stats: { nodeCount: number; edgeCount: number }) => void;
  onFilterStatsChange?: (stats: {
    hiddenNodes: number;
    hiddenEdges: number;
  }) => void;
  onRegisterInteractionApi?: (api: GraphInteractionApi) => void;
  onRegisterExport?: (exportFn: () => Promise<string>) => void;
  onRegisterReset?: (resetFn: () => void) => void;
  filters: FilterState;
  paperCount: number;
  refreshTrigger: number;
}

function GraphLoader({
  onNodeClick,
  onNodeSelect,
  onEdgeClick,
  selectionMode = false,
  focusNode,
  onStatsChange,
  onFilterStatsChange,
  onRegisterInteractionApi,
  onRegisterExport,
  onRegisterReset,
  filters,
  paperCount,
  refreshTrigger,
}: GraphLoaderProps) {
  const loadGraph = useLoadGraph();
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const graphRef = useRef<Graph | null>(null);

  // Load graph data from API
  useEffect(() => {
    async function loadGraphData() {
      const { nodes, edges } = await graphAPI.fetchGraph(paperCount);

      const graph = new Graph();

      // Add nodes with all attributes
      nodes.forEach((node) => {
        graph.addNode(node.id, {
          ...node,
          originalSize: node.size,
          hidden: false,
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

      // Report stats
      onStatsChange({
        nodeCount: graph.order,
        edgeCount: graph.size,
      });
    }

    loadGraphData();
  }, [loadGraph, onStatsChange, paperCount, refreshTrigger]);

  // Apply filters when they change
  useEffect(() => {
    const graph = graphRef.current || sigma.getGraph();
    if (!graph || graph.order === 0) return;

    const { hiddenNodes, hiddenEdges } = graphAPI.applyFilters(graph, filters);

    // Update node visibility
    graph.forEachNode((node, attrs) => {
      const isHidden = hiddenNodes.has(node);
      graph.setNodeAttribute(node, "hidden", isHidden);
      // Dim hidden nodes instead of completely hiding for visual feedback
      if (isHidden) {
        graph.setNodeAttribute(node, "color", "rgba(100, 100, 100, 0.2)");
      } else {
        graph.setNodeAttribute(
          node,
          "color",
          attrs.originalColor || CLUSTER_COLORS[attrs.cluster] || "#3b82f6",
        );
      }
    });

    // Update edge visibility
    graph.forEachEdge((edge, attrs) => {
      const isHidden = hiddenEdges.has(edge);
      graph.setEdgeAttribute(edge, "hidden", isHidden);
      if (isHidden) {
        graph.setEdgeAttribute(edge, "color", "rgba(100, 100, 100, 0.1)");
        graph.setEdgeAttribute(edge, "size", 0.5);
      } else {
        graph.setEdgeAttribute(edge, "color", attrs.originalColor || "#e5e7eb");
        graph.setEdgeAttribute(edge, "size", attrs.originalSize || 1);
      }
    });

    // Report filtering stats
    if (onFilterStatsChange) {
      onFilterStatsChange({
        hiddenNodes: hiddenNodes.size,
        hiddenEdges: hiddenEdges.size,
      });
    }

    // Only refresh ONCE after all updates
    sigma.refresh();

    // Report filtering stats
    if (onFilterStatsChange) {
      onFilterStatsChange({
        hiddenNodes: hiddenNodes.size,
        hiddenEdges: hiddenEdges.size,
      });
    }
  }, [filters, sigma, onFilterStatsChange]);

  // Register Interaction API
  useEffect(() => {
    if (!onRegisterInteractionApi) return;

    const api: GraphInteractionApi = {
      focusNodes: (nodeIds) => {
        const graph = sigma.getGraph();
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        let foundNode = false;

        nodeIds.forEach((nodeId) => {
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
          .animate({ x: cx, y: cy, ratio: 0.5, angle: 0 }, { duration: 800 });
      },

      exportSelection: (nodeIds) => {
        const graph = sigma.getGraph();
        const data = nodeIds
          .map((id) => {
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
          console.warn(
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
              (row) =>
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

      findPaths: (sourceId, targetId) => {
        const graph = sigma.getGraph();
        // BFS Implementation
        const queue: string[][] = [[sourceId]];
        const visited = new Set<string>();
        visited.add(sourceId);

        // Find one shortest path
        let pathIds: string[] | null = null;

        while (queue.length > 0) {
          const path = queue.shift()!;
          const node = path[path.length - 1];

          if (node === targetId) {
            pathIds = path;
            break;
          }

          if (path.length > 4) continue;

          // Use graph.neighbors to find ANY connection (treat as undirected)
          graph.forEachNeighbor(node, (neighbor) => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push([...path, neighbor]);
            }
          });
        }

        if (!pathIds) return [];

        const pathNodes = pathIds.map((id) => {
          const attrs = graph.getNodeAttributes(id);
          return {
            id,
            title: attrs.title || attrs.label,
            year: attrs.year || 2024,
            authors: attrs.authors || "Unknown",
          };
        });

        const pathEdges = [];
        for (let i = 0; i < pathIds.length - 1; i++) {
          const u = pathIds[i];
          const v = pathIds[i + 1];
          let edge: string | undefined;
          if (graph.hasEdge(u, v)) edge = graph.edge(u, v);
          else if (graph.hasEdge(v, u)) edge = graph.edge(v, u);
          if (edge) {
            const attrs = graph.getEdgeAttributes(edge);
            pathEdges.push({
              type: (attrs.edgeType || "supports") as
                | "supports"
                | "contradicts"
                | "extends",
              confidence: attrs.confidence || 80,
            });
          }
        }

        return [
          {
            id: "calculated-1",
            name: "Shortest Path",
            nodes: pathNodes,
            edges: pathEdges,
            color: "#3b82f6",
          },
        ];
      },
    };

    onRegisterInteractionApi(api);
  }, [sigma, onRegisterInteractionApi]);

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
        const evidence: EdgeEvidence = {
          id: event.edge,
          edgeType: (attrs.edgeType || "supports") as
            | "supports"
            | "contradicts"
            | "extends",
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
              text: "...demonstrates a clear correlation between the proposed method and...",
              source: "Section 4.2",
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

  // Apply hover effects
  useEffect(() => {
    if (!focusNode) return;

    const graph = sigma.getGraph();
    if (!graph.hasNode(focusNode)) {
      console.warn(`Node ${focusNode} not found`);
      return;
    }

    const nodePosition = sigma.getNodeDisplayData(focusNode);
    if (nodePosition) {
      sigma
        .getCamera()
        .animate(
          { x: nodePosition.x, y: nodePosition.y, ratio: 0.1, angle: 0 },
          { duration: 600 },
        );
    }
  }, [focusNode, sigma]);

  // Apply hover effects
  useEffect(() => {
    const graph = sigma.getGraph();
    if (!graph || graph.order === 0) return;

    graph.forEachNode((node, attrs) => {
      if (attrs.hidden) return; // Skip hidden nodes

      if (hoveredNode) {
        if (node === hoveredNode) {
          graph.setNodeAttribute(
            node,
            "size",
            (attrs.originalSize || attrs.size) * 1.4,
          );
          graph.setNodeAttribute(node, "zIndex", 10);
        } else {
          graph.setNodeAttribute(
            node,
            "size",
            (attrs.originalSize || attrs.size) * 0.8,
          );
          graph.setNodeAttribute(node, "zIndex", 0);
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
          graph.setEdgeAttribute(edge, "size", (attrs.originalSize || 1) * 2.5);
          graph.setEdgeAttribute(edge, "zIndex", 10);
        } else {
          graph.setEdgeAttribute(edge, "size", 0.5);
          graph.setEdgeAttribute(edge, "zIndex", 0);
        }
      } else {
        graph.setEdgeAttribute(edge, "size", attrs.originalSize || 1);
        graph.setEdgeAttribute(edge, "zIndex", 0);
      }
    });

    sigma.refresh();
  }, [hoveredNode, sigma]);

  return null;
}

// Cluster colors for node coloring
const CLUSTER_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6"];

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
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 fade-in duration-500">
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
  const [filterStats, setFilterStats] = useState({
    hiddenNodes: 0,
    hiddenEdges: 0,
  });
  const [paperCount, setPaperCount] = useState(25);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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

  // Search State
  const [searchTarget, setSearchTarget] = useState<string | null>(null);

  // Export function ref
  const exportGraphRef = useRef<(() => Promise<string>) | null>(null);

  // Reset function ref
  const resetViewRef = useRef<(() => void) | null>(null);
  const graphApiRef = useRef<GraphInteractionApi | null>(null);

  // Physics State
  const [physicsEnabled, setPhysicsEnabled] = useState(true); // Default to on

  // Show demo toast after a delay
  useEffect(() => {
    const timer = setTimeout(() => setShowToast(true), 3000);
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

  // Handle path comparison calculation
  const handleComparePaths = useCallback(() => {
    if (selectedNodes.length < 2 || !graphApiRef.current) return;

    const source = selectedNodes[0];
    const target = selectedNodes[1];

    const newPaths = graphApiRef.current.findPaths(source, target);

    setCalculatedPaths(newPaths);
    setPathCompareOpen(true);
  }, [selectedNodes]);

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
        console.log("Action:", action);
    }
  }, []);

  // Handle paper search from command bar
  const handleSearchPaper = useCallback(async (paperId: string) => {
    console.log("Search for paper:", paperId);
    setSearchTarget(paperId);

    // Also try to open inspector if we have data (simulated)
    // In a real app, we'd fetch data here
    // For now, let the user click naturally or we assume the search ID is valid
  }, []);

  return (
    <div className="h-full w-full relative">
      <SigmaContainer
        style={{
          height: "100%",
          width: "100%",
          background: isDark ? "#0B0C10" : "#F6F7F8",
        }}
        settings={{
          allowInvalidContainer: true,
          renderLabels: true,
          renderEdgeLabels: false,
          labelRenderedSizeThreshold: 6,
          labelDensity: 0.07,
          labelGridCellSize: 60,
          labelColor: { color: isDark ? "#fff" : "#000" },
          zIndex: true,
          defaultEdgeType: "arrow",
          enableEdgeEvents: true,
          labelFont: "Inter, system-ui, sans-serif",
          labelWeight: "500",
        }}
      >
        <GraphLoader
          onNodeClick={handleNodeClick}
          onStatsChange={handleStatsChange}
          onFilterStatsChange={setFilterStats}
          onRegisterInteractionApi={useCallback((api: any) => {
            graphApiRef.current = api;
          }, [])}
          filters={filters}
          paperCount={paperCount}
          refreshTrigger={refreshTrigger}
          selectionMode={selectionMode}
          focusNode={searchTarget}
          onRegisterExport={useCallback((fn: any) => {
            exportGraphRef.current = fn;
          }, [])}
          onRegisterReset={useCallback((fn: any) => {
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
        <NodeDragControl />
        <ControlsContainer position={"top-right"}>
          <ZoomControl />
          <FullScreenControl />
          <ForceAtlasControl
            externalIsRunning={physicsEnabled}
            onToggle={() => setPhysicsEnabled(!physicsEnabled)}
          />
        </ControlsContainer>
        <NodeTooltip />
        <EdgeLabels />
        <SearchControl />
        <ZoomIndicator />
      </SigmaContainer>

      {/* Status Indicator with real stats */}
      <CanvasStatusIndicator
        status="live"
        nodeCount={graphStats.nodeCount}
        edgeCount={graphStats.edgeCount}
      />

      {/* New Argument Toast */}
      <NewArgumentToast
        show={showToast}
        message="Photosynthetic Efficiency correlation detected"
        onClose={() => setShowToast(false)}
      />

      {/* Paper Inspector with real data */}
      <PaperInspector
        paper={selectedPaper}
        evidence={paperEvidence}
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
      />

      {/* Global Filters - now connected to graph */}
      <GlobalFilters
        filters={filters}
        onFiltersChange={setFilters}
        hiddenEdgeCount={filterStats.hiddenEdges}
        open={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
      />

      {/* Paper Count Control */}
      <PaperCountControl
        count={paperCount}
        onChange={(count) => {
          setPaperCount(count);
          setRefreshTrigger((t) => t + 1);
        }}
        onRefresh={() => setRefreshTrigger((t) => t + 1)}
        isLoading={isLoading}
      />

      {/* Graph Legend */}
      <GraphLegend />

      {/* Command Bar */}
      <CommandBar
        onSelectPaper={handleSearchPaper}
        onAction={handleCommandAction}
      />

      {/* Share Button */}
      <ShareButton onClick={() => setShareOpen(true)} />

      {/* Share/Export Dialog with real stats */}
      <ShareExportDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        graphTitle="Citation Network"
        nodeCount={graphStats.nodeCount}
        edgeCount={graphStats.edgeCount}
        onExportPNG={async () => {
          if (exportGraphRef.current) {
            const dataUrl = await exportGraphRef.current();
            // Helper to download
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = "citation-network.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }}
      />

      {/* Node Selection Tool */}
      <NodeSelectionTool
        isActive={selectionMode}
        onToggle={() => setSelectionMode(!selectionMode)}
        selectedNodes={selectedNodes}
        nodeLabels={nodeLabels}
        onClearSelection={() => setSelectedNodes([])}
        onRemoveNode={(nodeId: string) =>
          setSelectedNodes((prev) => prev.filter((id) => id !== nodeId))
        }
        onFocusSelection={handleFocusSelection}
        onCompare={handleComparePaths}
        onExport={() => handleExportSelection()}
      />

      {/* Path Comparison Button */}
      <PathComparisonButton
        onClick={() => setPathCompareOpen(true)}
        pathCount={selectedNodes.length >= 2 ? 2 : 0}
      />

      {/* Edge Evidence Popover */}
      <EdgeEvidencePopover
        evidence={edgeEvidence}
        position={edgeEvidencePos}
        onClose={() => {
          setEdgeEvidence(null);
          setEdgeEvidencePos(null);
        }}
        onViewPaper={(paperId) => {
          // TODO: Use handleSearchPaper to find/focus paper
          console.log("View paper:", paperId);
        }}
        onDispute={(edgeId) => {
          console.log("Dispute edge:", edgeId);
        }}
      />

      {/* Path Comparison View */}
      <PathComparisonView
        isOpen={pathCompareOpen}
        onClose={() => setPathCompareOpen(false)}
        paths={calculatedPaths}
      />
    </div>
  );
}
