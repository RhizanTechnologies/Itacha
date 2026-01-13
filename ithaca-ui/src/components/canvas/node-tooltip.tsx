"use client";

import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

interface PaperTooltipState {
  visible: boolean;
  nodeId: string;
  label: string;
  paperId: string;
  authors: string;
  year: number;
  citations: number;
  supports: number;
  refutes: number;
  isHighImpact: boolean;
  cluster: number;
}

const initialState: PaperTooltipState = {
  visible: false,
  nodeId: "",
  label: "",
  paperId: "",
  authors: "",
  year: 2024,
  citations: 0,
  supports: 0,
  refutes: 0,
  isHighImpact: false,
  cluster: 0,
};

export function NodeTooltip() {
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  const [tooltip, setTooltip] = useState<PaperTooltipState>(initialState);

  const handleEnterNode = useCallback((event: { node: string }) => {
    const nodeData = sigma.getGraph().getNodeAttributes(event.node);
    setTooltip({
      visible: true,
      nodeId: event.node,
      label: nodeData.label || `Paper ${event.node}`,
      paperId: nodeData.paperId || `#${event.node}`,
      authors: nodeData.authors || "Unknown",
      year: nodeData.year || 2024,
      citations: nodeData.citations || 0,
      supports: nodeData.supports || 0,
      refutes: nodeData.refutes || 0,
      isHighImpact: nodeData.isHighImpact || false,
      cluster: nodeData.cluster || 0,
    });
  }, [sigma]);

  const handleLeaveNode = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    registerEvents({
      enterNode: handleEnterNode,
      leaveNode: handleLeaveNode,
    });
  }, [registerEvents, handleEnterNode, handleLeaveNode]);

  if (!tooltip.visible) return null;

  // Calculate stats for mini-chart
  const total = tooltip.supports + tooltip.refutes;
  const supportsPercent = total > 0 ? (tooltip.supports / total) * 100 : 50;

  return (
    <div className="absolute top-4 right-4 z-10 w-80 pointer-events-none">
      {/* Card with fade-in animation */}
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200">
        {/* Header */}
        <div className="p-4 pb-3 border-b border-border bg-muted/30">
          <div className="flex justify-between items-start mb-2">
            {tooltip.isHighImpact && (
              <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-wider">
                High Impact
              </Badge>
            )}
            <span className="text-muted-foreground text-[10px] font-mono ml-auto">
              {tooltip.paperId}
            </span>
          </div>
          <h3 className="text-foreground text-sm font-bold leading-snug mb-1 line-clamp-2">
            {tooltip.label}
          </h3>
          <p className="text-muted-foreground text-xs font-medium">
            {tooltip.authors} ({tooltip.year})
          </p>
        </div>

        {/* Mini Chart Section */}
        <div className="p-4 bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-foreground text-xs font-medium">Relationship Overview</p>
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
                <span className="text-supports/60 text-xs font-mono flex items-center">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  12%
                </span>
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
                <span className="text-contradicts/60 text-xs font-mono flex items-center">
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                  2%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/30 px-4 py-2 flex items-center justify-between border-t border-border">
          <span className="text-muted-foreground text-[10px] font-mono">
            Cit: {tooltip.citations.toLocaleString()}
          </span>
          <button className="text-foreground hover:text-primary transition-colors text-xs font-medium flex items-center gap-1 pointer-events-auto">
            View Details
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
