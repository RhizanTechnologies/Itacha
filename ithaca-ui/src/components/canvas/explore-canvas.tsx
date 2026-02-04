"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  SigmaContainer,
  ControlsContainer,
  ZoomControl,
  FullScreenControl,
} from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import { useTheme } from "next-themes";
import Graph from "graphology";
import { NodeCircleProgram } from "sigma/rendering";
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
import { NodeDragControl } from "@/components/canvas/node-drag-control";
import { PaperCountControl } from "@/components/canvas/paper-count-control";
import {
  NewArgumentToast,
  createThemeAwareHoverDrawer,
} from "@/components/canvas/canvas-utils";
import { GraphLoader } from "@/components/canvas/graph-loader";
import { graphAPI } from "@/lib/api/graph-api";

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
import { CanvasFooter } from "@/components/canvas/canvas-footer";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  OverlayManager,
  TopLeftZone,
  TopRightZone,
  TopCenterZone,
  BottomLeftZone,
  BottomCenterZone,
  BottomRightZone,
} from "@/components/canvas/overlay-manager";
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
// MAIN CANVAS COMPONENT
// =============================================================================

export function ExploreCanvas() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isMobile = useIsMobile();

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
                defaultNodeType: "circle",
                nodeProgramClasses: {
                  circle: NodeCircleProgram,
                },
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
              {!isMobile && <ZoomControl />}
              <FullScreenControl />
              {!isMobile && (
                <ForceAtlasControl
                  externalIsRunning={physicsEnabled}
                  onToggle={() => setPhysicsEnabled(!physicsEnabled)}
                  nodeCount={graphStats.nodeCount}
                />
              )}
            </ControlsContainer>

            {/* Zoom indicator - needs sigma context */}
            {!isMobile && <ZoomIndicator />}
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
        <OverlayManager>
          {/* TOP-LEFT ZONE: Filters & Paper Count */}
          <TopLeftZone>
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
          </TopLeftZone>

          {/* TOP-RIGHT ZONE: AI Chat & Node Selection */}
          <TopRightZone>
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
          </TopRightZone>

          {/* TOP-CENTER ZONE: Focus Mode Banner */}
          {focusModeNode && (
            <TopCenterZone className="animate-in slide-in-from-top-2 fade-in duration-300">
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
            </TopCenterZone>
          )}

          {/* BOTTOM-LEFT ZONE: Unified Footer */}
          <BottomLeftZone>
            <CanvasFooter
              nodeCount={graphStats.nodeCount}
              edgeCount={graphStats.edgeCount}
              status={isLoading ? "loading" : "live"}
              onKeyboardHelpClick={() => setKeyboardHelpOpen(true)}
              onTutorialClick={tutorial.start}
              onTutorialRestart={tutorial.reset}
              hasSeenTutorial={tutorial.hasSeenTutorial}
            />
          </BottomLeftZone>

          {/* BOTTOM-CENTER ZONE: Selection Panel, Toast */}
          <BottomCenterZone>
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
            <SelectionInstruction
              isActive={selectionMode}
              hasSelection={selectedNodes.length > 0}
            />
            <NewArgumentToast
              show={showToast}
              message="Photosynthetic Efficiency correlation detected"
              onClose={() => setShowToast(false)}
            />
          </BottomCenterZone>

          {/* BOTTOM-RIGHT ZONE: Share Button */}
          <BottomRightZone>
            <ShareButton onClick={() => setShareOpen(true)} />
          </BottomRightZone>
        </OverlayManager>
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
          side={isMobile ? "bottom" : "right"}
          className={isMobile ? "h-[85%] rounded-t-xl" : undefined}
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
