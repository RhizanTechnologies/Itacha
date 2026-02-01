"use client";

import { useSigma, useRegisterEvents } from "@react-sigma/core";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { COLORS } from "@/lib/constants";

interface FlowingEdge {
  id: string;
  edgeType: "supports" | "contradicts" | "extends";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isHovered: boolean;
}

interface FlowingEdgesProps {
  /** Whether the flowing animation is enabled */
  enabled?: boolean;
}

/**
 * FlowingEdges Component
 *
 * Renders an SVG overlay with animated "flowing" edges that create
 * a river-like effect for graph connections. Optimized for performance:
 *
 * - Only renders edges that are visible in viewport
 * - Uses CSS animations (GPU-accelerated)
 * - Throttled updates on camera movement
 * - Special emphasis on "contradicts" edges (scientific debates)
 *
 * Animation behavior:
 * - Supports: Slow, smooth flow (subtle)
 * - Contradicts: Pulsing/interrupted flow (attention-grabbing)
 * - Extends: Medium flow with direction indicator
 */
export function FlowingEdges({ enabled = true }: FlowingEdgesProps) {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [flowingEdges, setFlowingEdges] = useState<FlowingEdge[]>([]);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Get container dimensions
  useEffect(() => {
    const container = sigma.getContainer();
    if (!container) return;

    const updateDimensions = () => {
      setDimensions({
        width: container.offsetWidth,
        height: container.offsetHeight,
      });
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [sigma]);

  // Calculate edge positions from Sigma's viewport
  const updateEdgePositions = useCallback(() => {
    if (!enabled) {
      setFlowingEdges([]);
      return;
    }

    const graph = sigma.getGraph();
    if (!graph || graph.size === 0) return;

    const edges: FlowingEdge[] = [];
    const { width, height } = dimensions;
    const MARGIN = 100;

    graph.forEachEdge((edge, attrs, source, target) => {
      // Skip hidden edges
      if (attrs.hidden) return;

      const sourceData = sigma.getNodeDisplayData(source);
      const targetData = sigma.getNodeDisplayData(target);

      if (!sourceData || !targetData) return;

      // Convert to screen coordinates
      const sourceScreen = sigma.graphToViewport(sourceData);
      const targetScreen = sigma.graphToViewport(targetData);

      // Only process edges that are at least partially in viewport
      const inViewport =
        (sourceScreen.x >= -MARGIN &&
          sourceScreen.x <= width + MARGIN &&
          sourceScreen.y >= -MARGIN &&
          sourceScreen.y <= height + MARGIN) ||
        (targetScreen.x >= -MARGIN &&
          targetScreen.x <= width + MARGIN &&
          targetScreen.y >= -MARGIN &&
          targetScreen.y <= height + MARGIN);

      if (!inViewport) return;

      edges.push({
        id: edge,
        edgeType: (attrs.edgeType as FlowingEdge["edgeType"]) || "supports",
        x1: sourceScreen.x,
        y1: sourceScreen.y,
        x2: targetScreen.x,
        y2: targetScreen.y,
        isHovered: edge === hoveredEdge,
      });
    });

    setFlowingEdges(edges);
  }, [sigma, hoveredEdge, enabled, dimensions]);

  // Register Sigma events - throttled updates
  useEffect(() => {
    if (!enabled) return;

    let rafId: number | null = null;

    const throttledUpdate = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateEdgePositions();
        rafId = null;
      });
    };

    // Initial update
    updateEdgePositions();

    // Subscribe to camera and graph changes
    sigma.on("afterRender", throttledUpdate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      sigma.off("afterRender", throttledUpdate);
    };
  }, [sigma, updateEdgePositions, enabled]);

  // Register hover events for edges
  useEffect(() => {
    if (!enabled) return;

    registerEvents({
      enterEdge: (event) => setHoveredEdge(event.edge),
      leaveEdge: () => setHoveredEdge(null),
    });
  }, [registerEvents, enabled]);

  // Pause animation when tab is hidden
  useEffect(() => {
    const handleVisibility = () => setIsAnimating(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Don't render if disabled
  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: dimensions.width || "100%",
        height: dimensions.height || "100%",
        pointerEvents: "none",
        zIndex: 5,
        overflow: "hidden",
      }}
    >
      <svg
        className="flowing-edges-overlay"
        width={dimensions.width || "100%"}
        height={dimensions.height || "100%"}
        aria-hidden="true"
        style={{
          display: "block",
          overflow: "visible",
        }}
      >
        <g className="flowing-edges-group">
          {flowingEdges.map((edge) => {
            const config = EDGE_CONFIGS[edge.edgeType] || EDGE_CONFIGS.supports;

            return (
              <line
                key={edge.id}
                className={`flowing-edge flowing-edge-${edge.edgeType}${edge.isHovered ? " hovered" : ""}`}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke={config.color}
                strokeWidth={
                  edge.isHovered ? config.strokeWidth * 1.5 : config.strokeWidth
                }
                strokeDasharray={config.dashArray}
                strokeLinecap="round"
                opacity={edge.isHovered ? 1 : config.opacity}
                style={{
                  animationPlayState: isAnimating ? "running" : "paused",
                }}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/** Edge styling configuration by type */
const EDGE_CONFIGS = {
  supports: {
    color: COLORS.SUPPORTS,
    dashArray: "6 8",
    opacity: 0.5,
    strokeWidth: 1.5,
  },
  contradicts: {
    color: COLORS.CONTRADICTS,
    dashArray: "4 6",
    opacity: 0.75,
    strokeWidth: 2.5,
  },
  extends: {
    color: COLORS.EXTENDS,
    dashArray: "8 6",
    opacity: 0.55,
    strokeWidth: 1.5,
  },
} as const;
