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
import type { PaperData, EvidenceItem } from "@/components/inspector/paper-inspector";
import { GlobalFilters, GraphLegend, FilterState, DEFAULT_FILTERS } from "@/components/filters/global-filters";
import { CommandBar } from "@/components/command/command-bar";
import { ShareExportDialog, ShareButton } from "@/components/share/share-export";
import { graphAPI, PaperNode } from "@/lib/api/graph-api";
import { Lightbulb, X } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";

// =============================================================================
// GRAPH LOADER COMPONENT
// =============================================================================

interface GraphLoaderProps {
  onNodeClick: (paper: PaperData, evidence: EvidenceItem[]) => void;
  onStatsChange: (stats: { nodeCount: number; edgeCount: number }) => void;
  filters: FilterState;
}

function GraphLoader({ onNodeClick, onStatsChange, filters }: GraphLoaderProps) {
  const loadGraph = useLoadGraph();
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const graphRef = useRef<Graph | null>(null);

  // Load graph data from API
  useEffect(() => {
    async function loadGraphData() {
      const { nodes, edges } = await graphAPI.fetchGraph();
      
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
  }, [loadGraph, onStatsChange]);

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
        graph.setNodeAttribute(node, "color", attrs.originalColor || CLUSTER_COLORS[attrs.cluster] || "#3b82f6");
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

    sigma.refresh();
  }, [filters, sigma]);

  // Set up event handlers
  useEffect(() => {
    registerEvents({
      enterNode: (event) => setHoveredNode(event.node),
      leaveNode: () => setHoveredNode(null),
      clickNode: async (event) => {
        const attrs = sigma.getGraph().getNodeAttributes(event.node);
        
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
    });
  }, [registerEvents, sigma, onNodeClick]);

  // Apply hover effects
  useEffect(() => {
    const graph = sigma.getGraph();
    if (!graph || graph.order === 0) return;

    graph.forEachNode((node, attrs) => {
      if (attrs.hidden) return; // Skip hidden nodes
      
      if (hoveredNode) {
        if (node === hoveredNode) {
          graph.setNodeAttribute(node, "size", (attrs.originalSize || attrs.size) * 1.4);
          graph.setNodeAttribute(node, "zIndex", 10);
        } else {
          graph.setNodeAttribute(node, "size", (attrs.originalSize || attrs.size) * 0.8);
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

function NewArgumentToast({ show, message, onClose }: { show: boolean; message: string; onClose: () => void }) {
  if (!show) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-card/95 backdrop-blur border border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] rounded-lg p-1 pr-4 flex items-center gap-3">
        <div className="bg-primary/20 text-primary p-2 rounded flex items-center justify-center">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-bold">New Argument Found</span>
          <span className="text-muted-foreground text-xs">{message}</span>
        </div>
        <button onClick={onClose} className="ml-4 text-muted-foreground hover:text-foreground transition-colors">
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

  // Calculate hidden edge count based on filters
  const hiddenEdgeCount = 
    (!filters.relationships.supports ? Math.floor(graphStats.edgeCount * 0.4) : 0) + 
    (!filters.relationships.contradicts ? Math.floor(graphStats.edgeCount * 0.3) : 0) + 
    (!filters.relationships.extends ? Math.floor(graphStats.edgeCount * 0.3) : 0);

  // Show demo toast after a delay
  useEffect(() => {
    const timer = setTimeout(() => setShowToast(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Handle node click - receives real data from GraphLoader
  const handleNodeClick = useCallback((paper: PaperData, evidence: EvidenceItem[]) => {
    setSelectedPaper(paper);
    setPaperEvidence(evidence);
    setInspectorOpen(true);
  }, []);

  // Handle stats update from GraphLoader
  const handleStatsChange = useCallback((stats: { nodeCount: number; edgeCount: number }) => {
    setGraphStats(stats);
  }, []);

  // Handle command bar actions
  const handleCommandAction = useCallback((action: string) => {
    switch (action) {
      case "open-filters":
        setFiltersOpen(true);
        break;
      case "export":
        setShareOpen(true);
        break;
      default:
        console.log("Action:", action);
    }
  }, []);

  // Handle paper search from command bar
  const handleSearchPaper = useCallback(async (paperId: string) => {
    // This would navigate to or highlight the paper in the graph
    console.log("Search for paper:", paperId);
    // TODO: Implement node focusing/highlighting
  }, []);

  return (
    <div className="h-full w-full relative">
      <SigmaContainer
        style={{ 
          height: "100%", 
          width: "100%", 
          background: isDark ? "#0B0C10" : "#F6F7F8" 
        }}
        settings={{
          allowInvalidContainer: true,
          renderLabels: true,
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
          filters={filters}
        />
        <ControlsContainer position={"bottom-right"}>
          <ZoomControl />
          <FullScreenControl />
          <ForceAtlasControl />
        </ControlsContainer>
        <NodeTooltip />
        <EdgeLabels />
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
        hiddenEdgeCount={hiddenEdgeCount}
        open={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
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

      {/* User Menu */}
      <div className="absolute top-4 right-24 z-30">
        <UserMenu variant="minimal" />
      </div>

      {/* Share/Export Dialog with real stats */}
      <ShareExportDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        graphTitle="Citation Network"
        nodeCount={graphStats.nodeCount}
        edgeCount={graphStats.edgeCount}
      />
    </div>
  );
}
