"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import type Graph from "graphology";
import type { Sigma } from "sigma";
import type { FilterState } from "@/components/filters/global-filters";
import type {
  PaperData,
  EvidenceItem,
} from "@/components/inspector/paper-inspector";
import type { EdgeEvidence } from "@/components/canvas/edge-evidence-popover";
import type { PathMode } from "@/components/canvas/path-comparison";
import type { CanvasInteractionApi } from "@/types/graph";
import { FILTERS } from "@/lib/constants";
import { DEFAULT_FILTERS } from "@/components/filters/global-filters";

// =============================================================================
// STATE TYPES
// =============================================================================

interface GraphStats {
  nodeCount: number;
  edgeCount: number;
}

interface DataRanges {
  minYear: number;
  maxYear: number;
  maxCitations: number;
}

interface FilterStats {
  hiddenNodes: number;
  hiddenEdges: number;
}

interface EdgeEvidencePosition {
  x: number;
  y: number;
}

export interface CanvasState {
  // UI State
  showToast: boolean;
  toastMessage: string;
  inspectorOpen: boolean;
  filtersOpen: boolean;
  shareOpen: boolean;
  keyboardHelpOpen: boolean;
  pathCompareOpen: boolean;
  chatOpen: boolean;
  listPanelOpen: boolean;

  // Loading State
  isLoading: boolean;

  // Graph Data State
  graphStats: GraphStats;
  dataRanges: DataRanges;
  filterStats: FilterStats;
  filters: FilterState;
  paperCount: number;
  refreshTrigger: number;
  solidNodes: Set<string>;
  visiblePapers: PaperData[];
  hoveredNode: string | null;

  // Selection State
  selectionMode: boolean;
  selectedNodes: string[];
  nodeLabels: Record<string, string>;

  // Paper Inspector State
  selectedPaper: PaperData | null;
  paperEvidence: EvidenceItem[];

  // Edge Evidence State
  edgeEvidence: EdgeEvidence | null;
  edgeEvidencePos: EdgeEvidencePosition | null;

  // Path Comparison State
  calculatedPaths: any[];
  pathMode: PathMode;

  // Search & Focus State
  searchTarget: string | null;
  focusModeNode: string | null;

  // Feature State
  physicsEnabled: boolean;
  tutorialActive: boolean;
}

// =============================================================================
// ACTIONS
// =============================================================================

type CanvasAction =
  // UI Actions
  | { type: "SET_SHOW_TOAST"; payload: boolean }
  | { type: "SET_INSPECTOR_OPEN"; payload: boolean }
  | { type: "SET_FILTERS_OPEN"; payload: boolean }
  | { type: "SET_SHARE_OPEN"; payload: boolean }
  | { type: "SET_KEYBOARD_HELP_OPEN"; payload: boolean }
  | { type: "SET_PATH_COMPARE_OPEN"; payload: boolean }
  | { type: "SET_CHAT_OPEN"; payload: boolean }
  | { type: "SET_LIST_PANEL_OPEN"; payload: boolean }
  | { type: "TOGGLE_FILTERS" }
  | { type: "TOGGLE_CHAT" }
  | { type: "TOGGLE_SELECTION_MODE" }
  | { type: "TOGGLE_PHYSICS" }
  | { type: "CLOSE_ALL_PANELS" }
  // Loading
  | { type: "SET_LOADING"; payload: boolean }
  // Graph Data
  | { type: "SET_GRAPH_STATS"; payload: GraphStats }
  | { type: "SET_DATA_RANGES"; payload: DataRanges }
  | { type: "SET_FILTER_STATS"; payload: FilterStats }
  | { type: "SET_FILTERS"; payload: FilterState }
  | { type: "SET_PAPER_COUNT"; payload: number }
  | { type: "TRIGGER_REFRESH" }
  | { type: "SET_SOLID_NODES"; payload: Set<string> }
  | { type: "ADD_SOLID_NODE"; payload: string }
  | { type: "SET_VISIBLE_PAPERS"; payload: PaperData[] }
  | { type: "SET_HOVERED_NODE"; payload: string | null }
  | { type: "SET_TOAST_MESSAGE"; payload: string }
  // Selection
  | { type: "SET_SELECTION_MODE"; payload: boolean }
  | { type: "SET_SELECTED_NODES"; payload: string[] }
  | { type: "ADD_SELECTED_NODE"; payload: string }
  | { type: "REMOVE_SELECTED_NODE"; payload: string }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_NODE_LABELS"; payload: Record<string, string> }
  // Paper Inspector
  | {
      type: "SET_SELECTED_PAPER";
      payload: { paper: PaperData; evidence: EvidenceItem[] };
    }
  | { type: "CLEAR_SELECTED_PAPER" }
  // Edge Evidence
  | {
      type: "SET_EDGE_EVIDENCE";
      payload: { evidence: EdgeEvidence; position: EdgeEvidencePosition };
    }
  | { type: "CLEAR_EDGE_EVIDENCE" }
  // Path Comparison
  | { type: "SET_CALCULATED_PATHS"; payload: any[] }
  | { type: "SET_PATH_MODE"; payload: PathMode }
  // Search & Focus
  | { type: "SET_SEARCH_TARGET"; payload: string | null }
  | { type: "SET_FOCUS_MODE_NODE"; payload: string | null }
  // Features
  | { type: "SET_PHYSICS_ENABLED"; payload: boolean }
  | { type: "SET_TUTORIAL_ACTIVE"; payload: boolean };

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: CanvasState = {
  // UI State
  showToast: false,
  toastMessage: "",
  inspectorOpen: false,
  filtersOpen: false,
  shareOpen: false,
  keyboardHelpOpen: false,
  pathCompareOpen: false,
  chatOpen: false,
  listPanelOpen: false,

  // Loading State
  isLoading: false,

  // Graph Data State
  graphStats: { nodeCount: 0, edgeCount: 0 },
  dataRanges: {
    minYear: FILTERS.MIN_YEAR,
    maxYear: FILTERS.MAX_YEAR,
    maxCitations: FILTERS.DEFAULT_MAX_CITATIONS,
  },
  filterStats: { hiddenNodes: 0, hiddenEdges: 0 },
  filters: DEFAULT_FILTERS,
  paperCount: 25,
  refreshTrigger: 0,
  solidNodes: new Set(),
  visiblePapers: [],
  hoveredNode: null,

  // Selection State
  selectionMode: false,
  selectedNodes: [],
  nodeLabels: {},

  // Paper Inspector State
  selectedPaper: null,
  paperEvidence: [],

  // Edge Evidence State
  edgeEvidence: null,
  edgeEvidencePos: null,

  // Path Comparison State
  calculatedPaths: [],
  pathMode: "shortest",

  // Search & Focus State
  searchTarget: null,
  focusModeNode: null,

  // Feature State
  physicsEnabled: true,
  tutorialActive: false,
};

// =============================================================================
// REDUCER
// =============================================================================

function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    // UI Actions
    case "SET_SHOW_TOAST":
      return { ...state, showToast: action.payload };
    case "SET_INSPECTOR_OPEN":
      return { ...state, inspectorOpen: action.payload };
    case "SET_FILTERS_OPEN":
      return { ...state, filtersOpen: action.payload };
    case "SET_SHARE_OPEN":
      return { ...state, shareOpen: action.payload };
    case "SET_KEYBOARD_HELP_OPEN":
      return { ...state, keyboardHelpOpen: action.payload };
    case "SET_PATH_COMPARE_OPEN":
      return { ...state, pathCompareOpen: action.payload };
    case "SET_CHAT_OPEN":
      return { ...state, chatOpen: action.payload };
    case "SET_LIST_PANEL_OPEN":
      return { ...state, listPanelOpen: action.payload };
    case "TOGGLE_FILTERS":
      return { ...state, filtersOpen: !state.filtersOpen };
    case "TOGGLE_CHAT":
      return { ...state, chatOpen: !state.chatOpen };
    case "TOGGLE_SELECTION_MODE":
      return { ...state, selectionMode: !state.selectionMode };
    case "TOGGLE_PHYSICS":
      return { ...state, physicsEnabled: !state.physicsEnabled };
    case "CLOSE_ALL_PANELS":
      return {
        ...state,
        inspectorOpen: false,
        filtersOpen: false,
        shareOpen: false,
        chatOpen: false,
        edgeEvidence: null,
        edgeEvidencePos: null,
        focusModeNode: null,
        selectedNodes: [],
        selectionMode: false,
      };

    // Loading
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    // Graph Data
    case "SET_GRAPH_STATS":
      return { ...state, graphStats: action.payload };
    case "SET_DATA_RANGES":
      return { ...state, dataRanges: action.payload };
    case "SET_FILTER_STATS":
      return { ...state, filterStats: action.payload };
    case "SET_FILTERS":
      return { ...state, filters: action.payload };
    case "SET_PAPER_COUNT":
      return { ...state, paperCount: action.payload };
    case "TRIGGER_REFRESH":
      return { ...state, refreshTrigger: state.refreshTrigger + 1 };
    case "SET_SOLID_NODES":
      return { ...state, solidNodes: action.payload };
    case "ADD_SOLID_NODE": {
      const next = new Set(state.solidNodes);
      next.add(action.payload);
      return { ...state, solidNodes: next };
    }
    case "SET_VISIBLE_PAPERS":
      return { ...state, visiblePapers: action.payload };
    case "SET_HOVERED_NODE":
      return { ...state, hoveredNode: action.payload };
    case "SET_TOAST_MESSAGE":
      return { ...state, toastMessage: action.payload, showToast: true };

    // Selection
    case "SET_SELECTION_MODE":
      return { ...state, selectionMode: action.payload };
    case "SET_SELECTED_NODES":
      return { ...state, selectedNodes: action.payload };
    case "ADD_SELECTED_NODE":
      return {
        ...state,
        selectedNodes: state.selectedNodes.includes(action.payload)
          ? state.selectedNodes
          : [...state.selectedNodes, action.payload],
      };
    case "REMOVE_SELECTED_NODE":
      return {
        ...state,
        selectedNodes: state.selectedNodes.filter(
          (id) => id !== action.payload,
        ),
      };
    case "CLEAR_SELECTION":
      return { ...state, selectedNodes: [], selectionMode: false };
    case "SET_NODE_LABELS":
      return { ...state, nodeLabels: action.payload };

    // Paper Inspector
    case "SET_SELECTED_PAPER":
      return {
        ...state,
        selectedPaper: action.payload.paper,
        paperEvidence: action.payload.evidence,
        inspectorOpen: true,
      };
    case "CLEAR_SELECTED_PAPER":
      return {
        ...state,
        selectedPaper: null,
        paperEvidence: [],
        inspectorOpen: false,
      };

    // Edge Evidence
    case "SET_EDGE_EVIDENCE":
      return {
        ...state,
        edgeEvidence: action.payload.evidence,
        edgeEvidencePos: action.payload.position,
      };
    case "CLEAR_EDGE_EVIDENCE":
      return { ...state, edgeEvidence: null, edgeEvidencePos: null };

    // Path Comparison
    case "SET_CALCULATED_PATHS":
      return { ...state, calculatedPaths: action.payload };
    case "SET_PATH_MODE":
      return { ...state, pathMode: action.payload };

    // Search & Focus
    case "SET_SEARCH_TARGET":
      return { ...state, searchTarget: action.payload };
    case "SET_FOCUS_MODE_NODE":
      return { ...state, focusModeNode: action.payload };

    // Features
    case "SET_PHYSICS_ENABLED":
      return { ...state, physicsEnabled: action.payload };
    case "SET_TUTORIAL_ACTIVE":
      return { ...state, tutorialActive: action.payload };

    default:
      return state;
  }
}

// =============================================================================
// REFS CONTEXT (for Sigma, Graph, etc. that can't be in reducer)
// =============================================================================

interface CanvasRefs {
  sigmaRef: React.MutableRefObject<Sigma | null>;
  graphRef: React.MutableRefObject<Graph | null>;
  graphApiRef: React.MutableRefObject<CanvasInteractionApi | null>;
  exportGraphRef: React.MutableRefObject<(() => Promise<string>) | null>;
  resetViewRef: React.MutableRefObject<(() => void) | null>;
}

// =============================================================================
// CONTEXT
// =============================================================================

interface CanvasContextValue {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
  refs: CanvasRefs;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface CanvasProviderProps {
  children: ReactNode;
}

export function CanvasProvider({ children }: CanvasProviderProps) {
  const [state, dispatch] = useReducer(canvasReducer, initialState);

  // Create stable refs
  const sigmaRef = React.useRef<Sigma | null>(null);
  const graphRef = React.useRef<Graph | null>(null);
  const graphApiRef = React.useRef<CanvasInteractionApi | null>(null);
  const exportGraphRef = React.useRef<(() => Promise<string>) | null>(null);
  const resetViewRef = React.useRef<(() => void) | null>(null);

  const refs = useMemo(
    () => ({
      sigmaRef,
      graphRef,
      graphApiRef,
      exportGraphRef,
      resetViewRef,
    }),
    [],
  );

  const value = useMemo(() => ({ state, dispatch, refs }), [state, refs]);

  return (
    <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
  );
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Access the full canvas context
 */
export function useCanvasContext() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvasContext must be used within a CanvasProvider");
  }
  return context;
}

/**
 * Access only canvas state (read-only)
 */
export function useCanvasState() {
  const { state } = useCanvasContext();
  return state;
}

/**
 * Access dispatch function for state updates
 */
export function useCanvasDispatch() {
  const { dispatch } = useCanvasContext();
  return dispatch;
}

/**
 * Access canvas refs (Sigma, Graph, etc.)
 */
export function useCanvasRefs() {
  const { refs } = useCanvasContext();
  return refs;
}

/**
 * Convenience hook for common actions
 */
export function useCanvasActions() {
  const dispatch = useCanvasDispatch();

  return useMemo(
    () => ({
      // UI
      setShowToast: (show: boolean) =>
        dispatch({ type: "SET_SHOW_TOAST", payload: show }),
      setInspectorOpen: (open: boolean) =>
        dispatch({ type: "SET_INSPECTOR_OPEN", payload: open }),
      setFiltersOpen: (open: boolean) =>
        dispatch({ type: "SET_FILTERS_OPEN", payload: open }),
      setShareOpen: (open: boolean) =>
        dispatch({ type: "SET_SHARE_OPEN", payload: open }),
      setChatOpen: (open: boolean) =>
        dispatch({ type: "SET_CHAT_OPEN", payload: open }),
      setKeyboardHelpOpen: (open: boolean) =>
        dispatch({ type: "SET_KEYBOARD_HELP_OPEN", payload: open }),
      setPathCompareOpen: (open: boolean) =>
        dispatch({ type: "SET_PATH_COMPARE_OPEN", payload: open }),
      toggleFilters: () => dispatch({ type: "TOGGLE_FILTERS" }),
      toggleChat: () => dispatch({ type: "TOGGLE_CHAT" }),
      toggleSelectionMode: () => dispatch({ type: "TOGGLE_SELECTION_MODE" }),
      togglePhysics: () => dispatch({ type: "TOGGLE_PHYSICS" }),
      closeAllPanels: () => dispatch({ type: "CLOSE_ALL_PANELS" }),

      // Loading
      setLoading: (loading: boolean) =>
        dispatch({ type: "SET_LOADING", payload: loading }),

      // Graph Data
      setGraphStats: (stats: GraphStats) =>
        dispatch({ type: "SET_GRAPH_STATS", payload: stats }),
      setDataRanges: (ranges: DataRanges) =>
        dispatch({ type: "SET_DATA_RANGES", payload: ranges }),
      setFilterStats: (stats: FilterStats) =>
        dispatch({ type: "SET_FILTER_STATS", payload: stats }),
      setFilters: (filters: FilterState) =>
        dispatch({ type: "SET_FILTERS", payload: filters }),
      setPaperCount: (count: number) =>
        dispatch({ type: "SET_PAPER_COUNT", payload: count }),
      triggerRefresh: () => dispatch({ type: "TRIGGER_REFRESH" }),
      setSolidNodes: (nodes: Set<string>) =>
        dispatch({ type: "SET_SOLID_NODES", payload: nodes }),
      addSolidNode: (nodeId: string) =>
        dispatch({ type: "ADD_SOLID_NODE", payload: nodeId }),
      setVisiblePapers: (papers: PaperData[]) =>
        dispatch({ type: "SET_VISIBLE_PAPERS", payload: papers }),
      setHoveredNode: (nodeId: string | null) =>
        dispatch({ type: "SET_HOVERED_NODE", payload: nodeId }),
      setListPanelOpen: (open: boolean) =>
        dispatch({ type: "SET_LIST_PANEL_OPEN", payload: open }),
      showToastMessage: (message: string) =>
        dispatch({ type: "SET_TOAST_MESSAGE", payload: message }),

      // Selection
      setSelectionMode: (mode: boolean) =>
        dispatch({ type: "SET_SELECTION_MODE", payload: mode }),
      setSelectedNodes: (nodes: string[]) =>
        dispatch({ type: "SET_SELECTED_NODES", payload: nodes }),
      addSelectedNode: (nodeId: string) =>
        dispatch({ type: "ADD_SELECTED_NODE", payload: nodeId }),
      removeSelectedNode: (nodeId: string) =>
        dispatch({ type: "REMOVE_SELECTED_NODE", payload: nodeId }),
      clearSelection: () => dispatch({ type: "CLEAR_SELECTION" }),
      setNodeLabels: (labels: Record<string, string>) =>
        dispatch({ type: "SET_NODE_LABELS", payload: labels }),

      // Paper Inspector
      selectPaper: (paper: PaperData, evidence: EvidenceItem[]) =>
        dispatch({ type: "SET_SELECTED_PAPER", payload: { paper, evidence } }),
      clearSelectedPaper: () => dispatch({ type: "CLEAR_SELECTED_PAPER" }),

      // Edge Evidence
      showEdgeEvidence: (
        evidence: EdgeEvidence,
        position: EdgeEvidencePosition,
      ) =>
        dispatch({
          type: "SET_EDGE_EVIDENCE",
          payload: { evidence, position },
        }),
      clearEdgeEvidence: () => dispatch({ type: "CLEAR_EDGE_EVIDENCE" }),

      // Path Comparison
      setCalculatedPaths: (paths: any[]) =>
        dispatch({ type: "SET_CALCULATED_PATHS", payload: paths }),
      setPathMode: (mode: PathMode) =>
        dispatch({ type: "SET_PATH_MODE", payload: mode }),

      // Search & Focus
      setSearchTarget: (target: string | null) =>
        dispatch({ type: "SET_SEARCH_TARGET", payload: target }),
      setFocusModeNode: (nodeId: string | null) =>
        dispatch({ type: "SET_FOCUS_MODE_NODE", payload: nodeId }),

      // Features
      setPhysicsEnabled: (enabled: boolean) =>
        dispatch({ type: "SET_PHYSICS_ENABLED", payload: enabled }),
      setTutorialActive: (active: boolean) =>
        dispatch({ type: "SET_TUTORIAL_ACTIVE", payload: active }),
    }),
    [dispatch],
  );
}
