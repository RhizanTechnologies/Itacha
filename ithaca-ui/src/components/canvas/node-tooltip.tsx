"use client";

import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { useEffect, useState, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

interface PaperTooltipState {
  visible: boolean;
  nodeId: string;
  label: string;
  title: string;
  paperId: string;
  authors: string;
  year: number;
  venue: string;
  citations: number;
  supports: number;
  refutes: number;
  isHighImpact: boolean;
  cluster: number;
  status: "solid" | "ghost";
  abstract: string;
}

const initialState: PaperTooltipState = {
  visible: false,
  nodeId: "",
  label: "",
  title: "",
  paperId: "",
  authors: "",
  year: 2024,
  venue: "",
  citations: 0,
  supports: 0,
  refutes: 0,
  isHighImpact: false,
  cluster: 0,
  status: "solid",
  abstract: "",
};

interface NodeTooltipProps {
  onExpand?: (
    nodeId: string,
    direction: "in" | "out",
    type?: "all" | "supports" | "contradicts",
  ) => void;
  onFocus?: (nodeId: string) => void;
  onAddToProject?: (nodeId: string) => void;
  onViewDetails?: (nodeId: string) => void;
}

export function NodeTooltip({
  onExpand,
  onFocus,
  onAddToProject,
  onViewDetails,
}: NodeTooltipProps) {
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  const [tooltip, setTooltip] = useState<PaperTooltipState>(initialState);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEnterNode = useCallback(
    (event: { node: string }) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      const nodeData = sigma.getGraph().getNodeAttributes(event.node);
      setTooltip({
        visible: true,
        nodeId: event.node,
        label: nodeData.label || `Paper ${event.node}`,
        title: nodeData.title || nodeData.label || `Paper ${event.node}`,
        paperId: nodeData.paperId || `#${event.node}`,
        authors: nodeData.authors || "Unknown",
        year: nodeData.year || 2024,
        venue: nodeData.venue || "",
        citations: nodeData.citations || 0,
        supports: nodeData.supports || 0,
        refutes: nodeData.refutes || 0,
        isHighImpact: nodeData.isHighImpact || false,
        cluster: nodeData.cluster || 0,
        status: nodeData.status || "solid",
        abstract: nodeData.abstract || "",
      });
    },
    [sigma],
  );

  const handleLeaveNode = useCallback(() => {
    // ... existing ...
    hideTimeoutRef.current = setTimeout(() => {
      setTooltip((prev) => ({ ...prev, visible: false }));
    }, 300);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setTooltip((prev) => ({ ...prev, visible: false }));
    }, 300);
  }, []);

  useEffect(() => {
    registerEvents({
      enterNode: handleEnterNode,
      leaveNode: handleLeaveNode,
    });
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [registerEvents, handleEnterNode, handleLeaveNode]);

  if (!tooltip.visible) return null;

  // Calculate stats for mini-chart
  const total = tooltip.supports + tooltip.refutes;
  const supportsPercent = total > 0 ? (tooltip.supports / total) * 100 : 50;

  return (
    <div className="absolute top-4 right-4 z-10 w-80 pointer-events-none">
      {/* Card with fade-in animation */}
      <div
        className="bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200 pointer-events-auto"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className="p-4 pb-3 border-b border-border bg-muted/30">
          <div className="flex justify-between items-start mb-2">
            <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
              {tooltip.status === "ghost" && (
                <Badge
                  variant="outline"
                  className="bg-primary/5 text-primary border-primary/20"
                >
                  Suggestion
                </Badge>
              )}
              {tooltip.isHighImpact && (
                <Badge
                  variant="destructive"
                  className="text-[10px] font-bold uppercase tracking-wider"
                >
                  High Impact
                </Badge>
              )}
            </div>
            <span className="text-muted-foreground text-[10px] font-mono ml-auto">
              {tooltip.paperId}
            </span>
          </div>
          <h3 className="text-foreground text-sm font-bold leading-snug mb-1 line-clamp-2">
            {tooltip.title}
          </h3>
          <p className="text-muted-foreground text-xs font-medium">
            {tooltip.authors} ({tooltip.year})
          </p>
          {tooltip.venue && (
            <p className="text-muted-foreground/70 text-[10px] mt-0.5 truncate italic">
              {tooltip.venue}
            </p>
          )}
        </div>

        {/* Mini Chart Section */}
        <div className="p-4 bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-foreground text-xs font-medium">
              Relationship Overview
            </p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-supports" />
                <span className="text-muted-foreground text-[10px]">Pos</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-contradicts" />
                <span className="text-muted-foreground text-[10px]">Neg</span>
              </span>
            </div>
          </div>

          {/* Balance Bar */}
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-3">
            <div
              className="h-full bg-supports transition-all duration-300"
              style={{ width: `${supportsPercent}%` }}
            />
          </div>

          {/* Stats Grid */}
          <div className="flex gap-4 pt-3 border-t border-border">
            <div className="flex-1">
              <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">
                Supports
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-supports text-lg font-mono font-bold">
                  {tooltip.supports}
                </span>
                {tooltip.supports > 0 && (
                  <span className="text-supports/60 text-xs font-mono flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    {total > 0 ? Math.round((tooltip.supports / total) * 100) : 0}%
                  </span>
                )}
              </div>
            </div>
            <div className="w-px bg-border" />
            <div className="flex-1">
              <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">
                Refutes
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-contradicts text-lg font-mono font-bold">
                  {tooltip.refutes}
                </span>
                {tooltip.refutes > 0 && (
                  <span className="text-contradicts/60 text-xs font-mono flex items-center">
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                    {total > 0 ? Math.round((tooltip.refutes / total) * 100) : 0}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Abstract Snippet */}
        {tooltip.abstract && (
          <div className="px-4 py-2 border-t border-border/50">
            <p className="text-muted-foreground/80 text-[11px] leading-relaxed line-clamp-2">
              {tooltip.abstract}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="bg-muted/30 px-4 py-2 flex items-center justify-between border-t border-border">
          <span className="text-muted-foreground text-[10px] font-mono">
            Cit: {tooltip.citations.toLocaleString()}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.(tooltip.nodeId);
            }}
            className="text-foreground hover:text-primary transition-colors text-xs font-medium flex items-center gap-1"
          >
            View Details
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Quick Expansion Actions */}
        {(onExpand || (onAddToProject && tooltip.status === "ghost")) && (
          <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-t border-border/50">
            {onAddToProject && tooltip.status === "ghost" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToProject(tooltip.nodeId);
                }}
                className="flex-1 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90 border border-primary rounded px-2 py-1 transition-colors flex items-center justify-center gap-1 font-medium shadow-sm"
              >
                Add to Project
              </button>
            )}

            {onFocus && tooltip.status === "solid" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFocus(tooltip.nodeId);
                }}
                className="flex-1 text-[10px] bg-background hover:bg-primary/10 border border-primary/20 text-primary rounded px-2 py-1 transition-colors flex items-center justify-center gap-1 font-medium"
                title="Isolate this paper"
              >
                Focus
              </button>
            )}
            {tooltip.status === "solid" && onExpand && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpand(tooltip.nodeId, "out", "all");
                  }}
                  className="flex-1 text-[10px] bg-background hover:bg-muted border border-border rounded px-2 py-1 transition-colors flex items-center justify-center gap-1"
                  title="Show papers this paper cites"
                >
                  + Refs
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpand(tooltip.nodeId, "in", "all");
                  }}
                  className="flex-1 text-[10px] bg-background hover:bg-muted border border-border rounded px-2 py-1 transition-colors flex items-center justify-center gap-1"
                  title="Show papers citing this paper"
                >
                  + Cites
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpand(tooltip.nodeId, "in", "contradicts");
                  }}
                  className="flex-1 text-[10px] bg-background hover:bg-destructive/10 border border-destructive/20 text-destructive rounded px-2 py-1 transition-colors flex items-center justify-center gap-1"
                  title="Show contradicting papers"
                >
                  + Critics
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
