/**
 * Application Constants
 *
 * Centralized constants to avoid magic numbers scattered throughout the codebase.
 * Organized by domain for easy discovery and maintenance.
 */

// =============================================================================
// ANIMATION & TIMING
// =============================================================================

export const ANIMATION = {
  /** Delay before hiding tooltip after mouse leaves (ms) */
  TOOLTIP_HIDE_DELAY: 300,
  /** Default camera animation duration (ms) */
  CAMERA_DURATION: 600,
  /** Camera animation duration for quick transitions (ms) */
  CAMERA_DURATION_FAST: 300,
  /** Camera animation duration for slow/smooth transitions (ms) */
  CAMERA_DURATION_SLOW: 800,
  /** Delay before showing demo toast on first load (ms) */
  TOAST_SHOW_DELAY: 3000,
  /** Time to let ForceAtlas2 stabilize before stopping (ms) */
  LAYOUT_STABILIZE: 2000,
  /** Debounce delay for search input (ms) */
  SEARCH_DEBOUNCE: 300,
} as const;

// =============================================================================
// GRAPH VISUALIZATION
// =============================================================================

export const GRAPH = {
  /** Size multiplier for hovered node */
  HOVER_SIZE_MULTIPLIER: 1.4,
  /** Size multiplier for non-hovered nodes when something is hovered */
  UNHOVER_SIZE_MULTIPLIER: 0.8,
  /** Size multiplier for edges connected to hovered node */
  HOVER_EDGE_SIZE_MULTIPLIER: 2.5,
  /** Size for edges not connected to hovered node */
  UNHOVER_EDGE_SIZE: 0.5,
  /** Default camera zoom ratio for focus operations */
  CAMERA_ZOOM_RATIO: 0.5,
  /** Tight zoom ratio for focusing on single node */
  FOCUS_ZOOM_RATIO: 0.1,
  /** Minimum number of nodes to fetch */
  MIN_NODE_COUNT: 5,
  /** Maximum number of nodes to fetch */
  MAX_NODE_COUNT: 200,
  /** Default number of nodes to load */
  DEFAULT_NODE_COUNT: 25,
  /** Z-index for highlighted elements */
  HIGHLIGHT_Z_INDEX: 10,
  /** Default node size */
  DEFAULT_NODE_SIZE: 5,
  /** Default edge size */
  DEFAULT_EDGE_SIZE: 1,
} as const;

// =============================================================================
// FILTERS
// =============================================================================

export const FILTERS = {
  /** Minimum year for publication filter (dynamic, can be updated) */
  MIN_YEAR: 2015,
  /** Maximum year for publication filter (current year + 1 for preprints) */
  get MAX_YEAR() {
    return new Date().getFullYear() + 1;
  },
  /** Minimum citations for filter */
  MIN_CITATIONS: 0,
  /** Maximum citations for filter (will be dynamically calculated from data) */
  DEFAULT_MAX_CITATIONS: 1000,
} as const;

// =============================================================================
// COLORS
// =============================================================================

export const COLORS = {
  /** Edge color for supporting relationships */
  SUPPORTS: "#22c55e",
  /** Edge color for contradicting relationships */
  CONTRADICTS: "#ef4444",
  /** Edge color for extending relationships */
  EXTENDS: "#eab308",
  /** Cluster colors for node grouping */
  CLUSTERS: ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6"] as const,
  /** Ghost node opacity (hex alpha suffix) */
  GHOST_ALPHA: "40",
  /** Dimmed color opacity factor */
  DIM_FACTOR: 0.3,
  /** Path visualization colors */
  PATH: {
    /** Default/shortest path color (blue) */
    DEFAULT: "#3b82f6",
    /** Conflict trail path color (red) */
    CONFLICT: "#ef4444",
    /** No direct conflict path color (grey) */
    NO_CONFLICT: "#94a3b8",
    /** Consensus lineage path color (green) */
    CONSENSUS: "#22c55e",
  },
} as const;

// =============================================================================
// SESSION & AUTH
// =============================================================================

export const SESSION = {
  /** Session duration in seconds (7 days) */
  EXPIRES_IN: 60 * 60 * 24 * 7,
  /** Session update frequency in seconds (24 hours) */
  UPDATE_AGE: 60 * 60 * 24,
  /** Cookie cache duration in seconds (5 minutes) */
  COOKIE_CACHE_MAX_AGE: 5 * 60,
} as const;

// =============================================================================
// RATE LIMITING
// =============================================================================

export const RATE_LIMIT = {
  /** Rate limit window in seconds */
  WINDOW: 60,
  /** Maximum requests per window */
  MAX_REQUESTS: 10,
  /** Default max attempts for custom rate limiting */
  DEFAULT_MAX_ATTEMPTS: 5,
  /** Default window for custom rate limiting (15 minutes in ms) */
  DEFAULT_WINDOW_MS: 15 * 60 * 1000,
} as const;

// =============================================================================
// UI
// =============================================================================

export const UI = {
  /** Maximum width for paper inspector on mobile */
  INSPECTOR_WIDTH_SM: "sm:max-w-xl",
  /** Maximum width for paper inspector on tablet */
  INSPECTOR_WIDTH_MD: "md:max-w-2xl",
  /** Maximum width for paper inspector on desktop */
  INSPECTOR_WIDTH_LG: "lg:max-w-4xl",
  /** Command bar max width */
  COMMAND_BAR_MAX_WIDTH: "max-w-sm",
  /** Maximum tags to show before overflow */
  MAX_VISIBLE_TAGS: 5,
} as const;

// =============================================================================
// LABELS
// =============================================================================

export const LABELS = {
  /** Sigma label density setting */
  DENSITY: 0.07,
  /** Sigma label grid cell size */
  GRID_CELL_SIZE: 60,
  /** Sigma label size threshold */
  SIZE_THRESHOLD: 6,
  /** Sigma label font */
  FONT: "Inter, system-ui, sans-serif",
  /** Sigma label weight */
  WEIGHT: "500",
} as const;

// =============================================================================
// CONTROVERSY
// =============================================================================

export const CONTROVERSY = {
  /** Minimum contradicting edges to mark node as controversial */
  THRESHOLD: 1,
} as const;
