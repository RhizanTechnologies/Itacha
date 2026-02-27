"use client";

import { useCallback, useMemo } from "react";
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
import { EdgeLabels } from "@/components/canvas/edge-labels";
import { CanvasErrorBoundary } from "@/components/canvas/canvas-error-boundary";
import { CanvasLoadingOverlay } from "@/components/canvas/canvas-loading";
import { CanvasEmptyState } from "@/components/canvas/canvas-empty-state";
import { PaperInspector } from "@/components/inspector/paper-inspector";
import { PaperListPanel } from "@/components/canvas/paper-list-panel";
import { List } from "lucide-react";
import { GlobalFilters } from "@/components/filters/global-filters";
import { CommandBar } from "@/components/command/command-bar";
import {
  ShareExportDialog,
  ShareButton,
} from "@/components/share/share-export";
import { SaveGraphDialog } from "@/components/canvas/save-graph-dialog";
import { NodeDragControl } from "@/components/canvas/node-drag-control";
import { PaperCountControl } from "@/components/canvas/paper-count-control";
import { RelationshipFocusControl } from "@/components/canvas/relationship-focus-control";
import {
  NewArgumentToast,
  createThemeAwareHoverDrawer,
} from "@/components/canvas/canvas-utils";
import { GraphLoader } from "@/components/canvas/graph-loader";
import { ZoomIndicator } from "@/components/canvas/zoom-indicator";
import { EdgeEvidencePopover } from "@/components/canvas/edge-evidence-popover";
import {
  CanvasChatPanel,
  ChatToggleButton,
} from "@/components/canvas/canvas-chat-panel";
import { PathComparisonView } from "@/components/canvas/path-comparison";
import {
  NodeSelectionTool,
  SelectionPanel,
  SelectionInstruction,
} from "@/components/canvas/node-selection";
import { debug } from "@/lib/debug";
import { useCanvasKeyboard } from "@/hooks/useCanvasKeyboard";
import { KeyboardShortcutsHelp } from "@/components/canvas/keyboard-shortcuts-help";
import { useTutorial, CANVAS_TUTORIAL } from "@/hooks/useTutorial";
import { TutorialOverlay } from "@/components/canvas/canvas-tutorial";
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
import { LABELS, COLORS } from "@/lib/constants";
import type { CanvasInteractionApi } from "@/types/graph";
import type { PaperData } from "@/components/inspector/paper-inspector";
import { graphAPI } from "@/lib/api/graph-api";
import { Button } from "../ui/button";

// Context hooks
import {
  useCanvasState,
  useCanvasActions,
  useCanvasRefs,
} from "@/contexts/canvas-context";

// Extracted hooks
import { useCanvasInteraction } from "@/hooks/useCanvasInteraction";
import { useCanvasSelection } from "@/hooks/useCanvasSelection";

// =============================================================================
// MAIN CANVAS COMPONENT
// =============================================================================

export function ExploreCanvas() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isMobile = useIsMobile();

  // All state from context
  const state = useCanvasState();
  const actions = useCanvasActions();
  const refs = useCanvasRefs();

  // Extracted interaction logic
  const {
    handleNodeClick,
    handleEdgeClick,
    handleEnterFocusMode,
    handleSearchPaper,
    handleCommandAction,
  } = useCanvasInteraction();

  // Extracted selection logic
  const {
    handleNodeSelect,
    handleFocusSelection,
    handleExportSelection,
    calculateAllPaths,
    switchPathMode,
    clearPathHighlight,
  } = useCanvasSelection();

  // Initialize keyboard shortcuts
  useCanvasKeyboard({
    sigma: refs.sigmaRef.current,
    enabled: true,
    onEscape: () => actions.closeAllPanels(),
    onShowHelp: () => actions.setKeyboardHelpOpen(true),
    onResetView: () => refs.resetViewRef.current?.(),
    onToggleFullscreen: () => {
      const container = document.querySelector(".react-sigma");
      if (container) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          container.requestFullscreen?.();
        }
      }
    },
    onToggleSelection: () => actions.toggleSelectionMode(),
    onToggleChat: () => actions.toggleChat(),
    onTogglePhysics: () => actions.togglePhysics(),
    onExport: () => actions.setShareOpen(true),
  });

  // Initialize tutorial
  const tutorial = useTutorial(CANVAS_TUTORIAL);

  // Memoize the theme-aware hover drawer
  const themeAwareHoverDrawer = useMemo(
    () => createThemeAwareHoverDrawer(isDark),
    [isDark],
  );

  // GraphLoader callback registrations (stable refs, defined once)
  const handleRegisterApi = useCallback(
    (api: CanvasInteractionApi) => {
      refs.graphApiRef.current = api;
    },
    [refs],
  );

  const handleRegisterSigmaGraph = useCallback(
    (sigma: any, graph: Graph) => {
      refs.sigmaRef.current = sigma;
      refs.graphRef.current = graph;
    },
    [refs],
  );

  const handleRegisterExport = useCallback(
    (fn: () => Promise<string>) => {
      refs.exportGraphRef.current = fn;
    },
    [refs],
  );

  const handleRegisterReset = useCallback(
    (fn: () => void) => {
      refs.resetViewRef.current = fn;
    },
    [refs],
  );

  const handleAddToProject = useCallback(
    (nodeId: string) => {
      actions.addSolidNode(nodeId);
    },
    [actions],
  );

  const handleGraphLoaded = useCallback(
    (nodes: PaperData[]) => {
      actions.setVisiblePapers(nodes);
    },
    [actions],
  );

  const handleTooltipExpand = useCallback(
    (nodeId: string, direction: "in" | "out", type?: "all" | "supports" | "contradicts" | "extends") => {
      refs.graphApiRef.current?.expandNode(nodeId, direction, type);
    },
    [refs],
  );

  const handleTooltipExpandByTopic = useCallback(
    (nodeId: string) => {
      refs.graphApiRef.current?.expandByTopic(nodeId);
    },
    [refs],
  );

  const handleTooltipViewDetails = useCallback(
    (nodeId: string) => {
      const graph = refs.graphRef.current;
      if (!graph || !graph.hasNode(nodeId)) return;
      const attrs = graph.getNodeAttributes(nodeId);
      const paperData = {
        id: attrs.paperId || nodeId,
        title: attrs.title || attrs.label || "Unknown",
        authors: attrs.authors || "Unknown",
        year: attrs.year || 2024,
        venue: attrs.venue,
        arxivId: attrs.arxivId,
        doi: attrs.doi,
        openAccessUrl: attrs.openAccessUrl,
        citations: attrs.citations || 0,
        references: attrs.references || 0,
        supports: attrs.supports || 0,
        refutes: attrs.refutes || 0,
        abstract: attrs.abstract,
        aiSummary: attrs.aiSummary,
        status: attrs.status,
      };
      graphAPI.getEvidence(nodeId).then((evidence) => {
        handleNodeClick(paperData, evidence);
      });
    },
    [refs, handleNodeClick],
  );

  const handlePaperCountChange = useCallback(
    (count: number) => {
      actions.setPaperCount(count);
      actions.triggerRefresh();
    },
    [actions],
  );

  const handleClearSelection = useCallback(() => {
    actions.clearSelection();
    clearPathHighlight();
  }, [actions, clearPathHighlight]);

  const handleListSelectNode = useCallback(
    async (nodeId: string) => {
      const paper = state.visiblePapers.find((p) => p.id === nodeId);
      if (paper) {
        // Fetch real evidence when selecting from list (same as clicking node)
        const evidence = await graphAPI.getEvidence(nodeId);
        actions.selectPaper(paper, evidence);
        const graph = refs.graphRef.current;
        if (graph && graph.hasNode(nodeId)) {
          const pos = graph.getNodeAttributes(nodeId);
          refs.sigmaRef.current?.getCamera().animate(
            {
              x: pos.x,
              y: pos.y,
              ratio: 0.5,
            },
            { duration: 600 },
          );
        }
      }
    },
    [state.visiblePapers, actions, refs],
  );

  return (
    <div className="h-full w-full flex flex-row">
      {/* Main Canvas Area */}
      <div className="flex-1 h-full relative overflow-x-auto min-w-[320px]">
        <CanvasErrorBoundary
          onError={(error) => debug.error("Canvas rendering error:", error)}
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
                labelRenderedSizeThreshold: LABELS.SIZE_THRESHOLD,
                labelDensity: LABELS.DENSITY,
                labelGridCellSize: LABELS.GRID_CELL_SIZE,
                labelColor: { color: isDark ? "#fff" : "#000" },
                hideEdgesOnMove: true,
                hideLabelsOnMove: true,
                renderEdgeLabels: false,
                zIndex: true,
                defaultEdgeType: "arrow",
                defaultNodeType: "circle",
                nodeProgramClasses: { circle: NodeCircleProgram },
                enableEdgeEvents: true,
                labelFont: LABELS.FONT,
                labelWeight: LABELS.WEIGHT,
                defaultDrawNodeHover: themeAwareHoverDrawer,
              } as const
            }
          >
            <GraphLoader
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onStatsChange={actions.setGraphStats}
              onDataRangesChange={actions.setDataRanges}
              onFilterStatsChange={actions.setFilterStats}
              onRegisterInteractionApi={handleRegisterApi}
              onRegisterSigmaGraph={handleRegisterSigmaGraph}
              onRegisterExport={handleRegisterExport}
              onRegisterReset={handleRegisterReset}
              onNodeSelect={handleNodeSelect}
              onAddToProject={handleAddToProject}
              onGraphLoaded={handleGraphLoaded}
              onHoverNode={actions.setHoveredNode}
              filters={state.filters}
              paperCount={state.paperCount}
              refreshTrigger={state.refreshTrigger}
              selectionMode={state.selectionMode}
              focusNode={state.searchTarget}
              focusModeNode={state.focusModeNode}
              solidNodes={state.solidNodes}
              hoveredNode={state.hoveredNode}
              relationshipFocus={state.relationshipFocus}
              selectedNodes={state.selectedNodes}
              highlightedPath={state.highlightedPath}
            />

            {/* Sigma-managed internal components */}
            <NodeDragControl />
            <NodeTooltip
              onExpand={handleTooltipExpand}
              onExpandByTopic={handleTooltipExpandByTopic}
              onFocus={handleEnterFocusMode}
              onViewDetails={handleTooltipViewDetails}
            />
            <EdgeLabels />

            {/* Sigma controls: hide zoom buttons on mobile (pinch-to-zoom instead) */}
            <ControlsContainer position={"top-right"}>
              {!isMobile && <ZoomControl />}
              {!isMobile && <FullScreenControl />}
              {!isMobile && (
                <ForceAtlasControl
                  externalIsRunning={state.physicsEnabled}
                  onToggle={() => actions.togglePhysics()}
                  nodeCount={state.graphStats.nodeCount}
                />
              )}
            </ControlsContainer>

            {!isMobile && <ZoomIndicator />}
          </SigmaContainer>
        </CanvasErrorBoundary>

        {/* Empty State */}
        {!state.isLoading && state.graphStats.nodeCount === 0 && (
          <CanvasEmptyState
            relationshipFocus={state.relationshipFocus}
            onRelationshipFocusChange={(focus) =>
              actions.setRelationshipFocus(focus)
            }
            onSearchSelect={handleSearchPaper}
            onSearchClick={() => {
              document.dispatchEvent(
                new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                  ctrlKey: true,
                  bubbles: true,
                }),
              );
            }}
          />
        )}

        <CanvasLoadingOverlay
          isLoading={state.isLoading}
          message="Loading graph..."
        />

        {/* ========== STRUCTURED OVERLAY SYSTEM ========== */}
        <OverlayManager>
          {/* Top-left: filters & paper count (desktop/tablet only) */}
          {!isMobile && (
            <TopLeftZone>
              <GlobalFilters
                filters={state.filters}
                onFiltersChange={actions.setFilters}
                hiddenEdgeCount={state.filterStats.hiddenEdges}
                open={state.filtersOpen}
                onToggle={() => actions.toggleFilters()}
                maxCitations={state.dataRanges.maxCitations}
                minYear={state.dataRanges.minYear}
                maxYear={state.dataRanges.maxYear}
              />
              <PaperCountControl
                count={state.paperCount}
                onChange={handlePaperCountChange}
                onRefresh={() => actions.triggerRefresh()}
                isLoading={state.isLoading}
              />
            </TopLeftZone>
          )}

          {/* Top-right: contextual action buttons (desktop only) */}
          {!isMobile && (
            <TopRightZone>
              <div className="flex flex-col gap-2">
                <Button
                  variant={state.listPanelOpen ? "default" : "outline"}
                  size="icon"
                  className="h-9 w-9 rounded-full shadow-md z-30 pointer-events-auto"
                  onClick={() => actions.setListPanelOpen(!state.listPanelOpen)}
                  title="Toggle List View"
                >
                  <List className="h-4 w-4" />
                </Button>
                <ChatToggleButton
                  isOpen={state.chatOpen}
                  onClick={() => actions.toggleChat()}
                />
                <NodeSelectionTool
                  isActive={state.selectionMode}
                  onToggle={() => actions.toggleSelectionMode()}
                  selectedNodes={state.selectedNodes}
                  nodeLabels={state.nodeLabels}
                />
              </div>
            </TopRightZone>
          )}

          {state.focusModeNode && (
            <TopCenterZone className="animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="bg-primary/90 backdrop-blur-md text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-3 border border-primary-foreground/20">
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">
                    Focus Mode
                  </span>
                </div>
                <div className="h-4 w-px bg-primary-foreground/30" />
                <button
                  onClick={() => actions.setFocusModeNode(null)}
                  className="text-xs font-bold hover:bg-white/20 px-2 py-1 rounded transition-colors"
                >
                  Exit Focus
                </button>
              </div>
            </TopCenterZone>
          )}

          {/* Bottom-left: footer (desktop/tablet only) */}
          {!isMobile && (
            <BottomLeftZone>
              <CanvasFooter
                nodeCount={state.graphStats.nodeCount}
                edgeCount={state.graphStats.edgeCount}
                status={state.isLoading ? "loading" : "live"}
                onKeyboardHelpClick={() => actions.setKeyboardHelpOpen(true)}
                onTutorialClick={tutorial.start}
                onTutorialRestart={tutorial.reset}
                hasSeenTutorial={tutorial.hasSeenTutorial}
              />
            </BottomLeftZone>
          )}

          {/* Bottom-center: mode tabs + selection panel */}
          <BottomCenterZone>
            {/* Relationship mode tabs — always visible */}
            <RelationshipFocusControl
              value={state.relationshipFocus}
              onChange={(focus) => actions.setRelationshipFocus(focus)}
            />
            <SelectionPanel
              selectedNodes={state.selectedNodes}
              nodeLabels={state.nodeLabels}
              onClearSelection={handleClearSelection}
              onRemoveNode={actions.removeSelectedNode}
              onFocusSelection={handleFocusSelection}
              onCompare={calculateAllPaths}
              onExport={handleExportSelection}
            />
            <SelectionInstruction
              isActive={state.selectionMode}
              selectedCount={state.selectedNodes.length}
            />
            <NewArgumentToast
              show={state.showToast}
              message={state.toastMessage}
              onClose={() => actions.setShowToast(false)}
            />
          </BottomCenterZone>

          {/* Bottom-right: save + share (desktop only) */}
          {!isMobile && (
            <BottomRightZone>
              <button
                onClick={() => actions.setSaveDialogOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card/90 backdrop-blur border border-border text-sm font-medium hover:bg-muted transition-colors shadow-sm"
                title="Save graph to dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                Save
              </button>
              <ShareButton onClick={() => actions.setShareOpen(true)} />
            </BottomRightZone>
          )}
        </OverlayManager>

        {/* List Panel */}
        <PaperListPanel
          open={state.listPanelOpen}
          onOpenChange={actions.setListPanelOpen}
          papers={state.visiblePapers}
          hoveredNode={state.hoveredNode}
          onHoverNode={actions.setHoveredNode}
          onSelectNode={handleListSelectNode}
        />

        {/* Contextual Overlays & Modals */}
        <PaperInspector
          paper={state.selectedPaper}
          evidence={state.paperEvidence}
          open={state.inspectorOpen}
          onOpenChange={actions.setInspectorOpen}
          side={isMobile ? "bottom" : "right"}
          className={isMobile ? "h-[85%] rounded-t-xl" : undefined}
        />

        <CommandBar
          onSelectPaper={handleSearchPaper}
          onAction={handleCommandAction}
          hideTrigger={true}
        />

        <ShareExportDialog
          open={state.shareOpen}
          onOpenChange={actions.setShareOpen}
          graphTitle={
            state.searchTarget
              ? state.searchTarget.startsWith("topic-")
                ? state.searchTarget.replace("topic-", "")
                : "Citation Network"
              : "Citation Network"
          }
          searchQuery={state.searchTarget ?? undefined}
          nodeCount={state.graphStats.nodeCount}
          edgeCount={state.graphStats.edgeCount}
          sigma={refs.sigmaRef.current}
          graph={refs.graphRef.current}
        />

        <SaveGraphDialog
          open={state.saveDialogOpen}
          onOpenChange={actions.setSaveDialogOpen}
          defaultTitle={
            state.searchTarget
              ? state.searchTarget.startsWith("topic-")
                ? state.searchTarget.replace("topic-", "")
                : "Citation Network"
              : "Citation Network"
          }
          searchQuery={state.searchTarget ?? undefined}
          nodeCount={state.graphStats.nodeCount}
          edgeCount={state.graphStats.edgeCount}
        />

        <EdgeEvidencePopover
          evidence={state.edgeEvidence}
          position={state.edgeEvidencePos}
          onClose={() => actions.clearEdgeEvidence()}
          onViewPaper={(paperId) => handleSearchPaper(paperId)}
          onDispute={(edgeId) => {
            debug.log("Dispute edge requested:", edgeId);
            actions.showToastMessage(
              "Dispute flagged — use Edit to correct the relationship",
            );
          }}
          onCorrect={(edgeId, type, comment) => {
            debug.log("Correction submitted:", { edgeId, type, comment });

            // Apply the correction to the user's local graph in real-time
            const graph = refs.graphRef.current;
            const sigma = refs.sigmaRef.current;
            if (graph && sigma && graph.hasEdge(edgeId)) {
              const EDGE_COLOR_MAP: Record<string, string> = {
                supports: COLORS.SUPPORTS,
                contradicts: COLORS.CONTRADICTS,
                extends: COLORS.EXTENDS,
                cites: COLORS.CITES || "#a1a1aa",
                unknown: COLORS.UNKNOWN || "#94a3b8",
              };
              const newColor = EDGE_COLOR_MAP[type] || "#e5e7eb";

              graph.setEdgeAttribute(edgeId, "edgeType", type);
              graph.setEdgeAttribute(edgeId, "color", newColor);
              graph.setEdgeAttribute(edgeId, "originalColor", newColor);
              graph.setEdgeAttribute(edgeId, "confidence", 100);
              graph.setEdgeAttribute(edgeId, "signalSource", "user-correction");
              graph.setEdgeAttribute(
                edgeId,
                "snippet",
                comment
                  ? `User correction: ${comment}`
                  : `User corrected relationship to "${type}".`,
              );
              graph.setEdgeAttribute(edgeId, "provider", "user-correction");
              sigma.refresh();

              // Persist to DB in background
              const source = graph.source(edgeId);
              const target = graph.target(edgeId);
              fetch("/api/classify/correct", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  citingId: source,
                  citedId: target,
                  edgeType: type === "refutes" ? "contradicts" : type,
                  comment,
                }),
              }).catch((err) => {
                debug.log("Failed to persist correction:", err);
              });
            }

            // Close the popover and show confirmation
            actions.clearEdgeEvidence();
            actions.showToastMessage(`Relationship corrected to "${type}"`);
          }}
        />

        <PathComparisonView
          isOpen={state.pathCompareOpen}
          onClose={() => {
            actions.setPathCompareOpen(false);
            clearPathHighlight();
          }}
          paths={state.calculatedPaths}
          currentMode={state.pathMode}
          onModeChange={switchPathMode}
        />

        <KeyboardShortcutsHelp
          open={state.keyboardHelpOpen}
          onOpenChange={actions.setKeyboardHelpOpen}
        />

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
        isOpen={state.chatOpen}
        onClose={() => actions.setChatOpen(false)}
        graphContext={{
          nodeCount: state.graphStats.nodeCount,
          edgeCount: state.graphStats.edgeCount,
          selectedNode: state.selectedNodes[0] || null,
          papers: state.visiblePapers.slice(0, 30).map((p) => ({
            title: p.title,
            authors: p.authors,
            year: p.year,
            citations: p.citations,
            supports: p.supports,
            refutes: p.refutes,
          })),
        }}
        onNavigateToPaper={handleSearchPaper}
        onFocusNode={(nodeId) => {
          refs.graphApiRef.current?.focusNodes([nodeId]);
        }}
      />
    </div>
  );
}
