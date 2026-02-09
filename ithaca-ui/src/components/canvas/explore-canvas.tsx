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
import { LABELS } from "@/lib/constants";
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
    calculatePathWithMode,
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
            />

            {/* Sigma-managed internal components */}
            <NodeDragControl />
            <NodeTooltip
              onExpand={(nodeId, direction, type) => {
                refs.graphApiRef.current?.expandNode(nodeId, direction, type);
              }}
              onFocus={handleEnterFocusMode}
              onViewDetails={(nodeId) => {
                // Simulate a node click to open inspector
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
              }}
            />
            <EdgeLabels />

            <ControlsContainer position={"top-right"}>
              {!isMobile && <ZoomControl />}
              <FullScreenControl />
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
            message="Search for a research topic to explore its citation network"
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
              onChange={(count) => {
                actions.setPaperCount(count);
                actions.triggerRefresh();
              }}
              onRefresh={() => actions.triggerRefresh()}
              isLoading={state.isLoading}
            />
            <RelationshipFocusControl
              value={state.relationshipFocus}
              onChange={(focus) => actions.setRelationshipFocus(focus)}
            />
          </TopLeftZone>

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

          <BottomCenterZone>
            <SelectionPanel
              selectedNodes={state.selectedNodes}
              nodeLabels={state.nodeLabels}
              onClearSelection={() => actions.clearSelection()}
              onRemoveNode={(nodeId: string) =>
                actions.removeSelectedNode(nodeId)
              }
              onFocusSelection={handleFocusSelection}
              onCompare={() => calculatePathWithMode(state.pathMode)}
              onExport={(format) => handleExportSelection(format)}
            />
            <SelectionInstruction
              isActive={state.selectionMode}
              hasSelection={state.selectedNodes.length > 0}
            />
            <NewArgumentToast
              show={state.showToast}
              message={state.toastMessage}
              onClose={() => actions.setShowToast(false)}
            />
          </BottomCenterZone>

          <BottomRightZone>
            <ShareButton onClick={() => actions.setShareOpen(true)} />
          </BottomRightZone>
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
          graphTitle="Citation Network"
          nodeCount={state.graphStats.nodeCount}
          edgeCount={state.graphStats.edgeCount}
          sigma={refs.sigmaRef.current}
          graph={refs.graphRef.current}
        />

        <EdgeEvidencePopover
          evidence={state.edgeEvidence}
          position={state.edgeEvidencePos}
          onClose={() => actions.clearEdgeEvidence()}
          onViewPaper={(paperId) => handleSearchPaper(paperId)}
          onDispute={(edgeId) => {
            debug.log("Dispute edge requested:", edgeId);
            actions.showToastMessage("Dispute flagged for review");
          }}
          onCorrect={(edgeId, type, comment) => {
            debug.log("Correction submitted:", { edgeId, type, comment });
            actions.showToastMessage(`Relationship corrected to ${type}`);
          }}
        />

        <PathComparisonView
          isOpen={state.pathCompareOpen}
          onClose={() => actions.setPathCompareOpen(false)}
          paths={state.calculatedPaths}
          currentMode={state.pathMode}
          onModeChange={calculatePathWithMode}
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
