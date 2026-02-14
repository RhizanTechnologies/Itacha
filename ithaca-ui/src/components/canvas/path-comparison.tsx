"use client";

import { useState, useMemo } from "react";
import {
  ContainedPanel,
  ContainedPanelContent,
} from "@/components/ui/contained-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitCompare,
  CheckCircle,
  XCircle,
  ArrowRightCircle,
  Link2,
  X,
  Route,
  Zap,
  Handshake,
  Info,
} from "lucide-react";

import type { SemanticPath, PathMode } from "@/lib/graph-algorithms";

const EDGE_CONFIG = {
  supports: { icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  contradicts: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
  },
  extends: {
    icon: ArrowRightCircle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  cites: {
    icon: Link2,
    color: "text-zinc-500 dark:text-zinc-400",
    bg: "bg-zinc-500/10",
  },
};

const MODE_CONFIG: Record<PathMode, { label: string; icon: typeof Route; description: string }> = {
  shortest: { label: "Shortest", icon: Route, description: "Most direct connection" },
  conflict: { label: "Conflict", icon: Zap, description: "Path through disputes" },
  consensus: { label: "Consensus", icon: Handshake, description: "Path through agreement" },
};

interface PathComparisonViewProps {
  isOpen: boolean;
  onClose: () => void;
  paths?: SemanticPath[];
  onModeChange?: (mode: PathMode) => void;
  currentMode?: PathMode;
}

/**
 * Renders a single path as a vertical node chain with edge badges.
 */
function PathChain({ path }: { path: SemanticPath }) {
  if (!path.nodes || path.nodes.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No path found for this mode.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {path.nodes.map((node, idx) => {
        const edge = path.edges?.[idx];
        const EdgeIcon = edge ? EDGE_CONFIG[edge.type]?.icon : null;

        return (
          <div key={node.id}>
            {/* Node card */}
            <div className="px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50">
              <h4 className="font-medium text-sm line-clamp-1">{node.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {node.authors} · {node.year}
              </p>
            </div>

            {/* Edge connector */}
            {edge && (
              <div className="flex items-center justify-center py-1">
                <div className="h-3 w-px bg-border" />
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mx-1 ${
                    EDGE_CONFIG[edge.type]?.bg || ""
                  } ${EDGE_CONFIG[edge.type]?.color || ""}`}
                >
                  {EdgeIcon && <EdgeIcon className="h-3 w-3" />}
                  <span className="capitalize">{edge.type}</span>
                  <span className="opacity-60">{edge.confidence}%</span>
                </div>
                <div className="h-3 w-px bg-border" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PathComparisonView({
  isOpen,
  onClose,
  paths = [],
  onModeChange,
  currentMode = "shortest",
}: PathComparisonViewProps) {
  // Group paths by mode
  const pathsByMode = useMemo(() => {
    const map: Record<PathMode, SemanticPath | null> = {
      shortest: null,
      conflict: null,
      consensus: null,
    };
    for (const p of paths) {
      if (p.id.includes("shortest")) map.shortest = p;
      else if (p.id.includes("conflict")) map.conflict = p;
      else if (p.id.includes("consensus")) map.consensus = p;
    }
    return map;
  }, [paths]);

  // Detect if all modes returned the same route (identical node sequence)
  const allPathsIdentical = useMemo(() => {
    const validPaths = [pathsByMode.shortest, pathsByMode.conflict, pathsByMode.consensus].filter(
      (p): p is SemanticPath => p !== null && p.nodes.length > 0,
    );
    if (validPaths.length < 2) return false;
    const ref = validPaths[0].nodes.map((n) => n.id).join(",");
    return validPaths.every((p) => p.nodes.map((n) => n.id).join(",") === ref);
  }, [pathsByMode]);

  const activePath = pathsByMode[currentMode];

  if (!isOpen) return null;

  return (
    <ContainedPanel
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      side="bottom"
      className="h-[45%]"
      backdrop="light"
      resizable
    >
      <ContainedPanelContent className="p-0 overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-card">
          <div className="flex items-center gap-2">
            <GitCompare className="h-4.5 w-4.5 text-primary" />
            <h2 className="text-sm font-semibold">Path Comparison</h2>
            {activePath && (
              <Badge variant="secondary" className="text-[10px]">
                {activePath.nodes?.length || 0} hops
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b bg-muted/30">
          {(["shortest", "conflict", "consensus"] as PathMode[]).map((mode) => {
            const config = MODE_CONFIG[mode];
            const Icon = config.icon;
            const modePath = pathsByMode[mode];
            const hasPath = modePath && modePath.nodes && modePath.nodes.length > 0;

            return (
              <button
                key={mode}
                onClick={() => onModeChange?.(mode)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
                  currentMode === mode
                    ? "border-primary text-foreground bg-background"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{config.label}</span>
                {hasPath && (
                  <span className="text-[10px] text-muted-foreground">
                    ({modePath!.nodes.length})
                  </span>
                )}
                {!hasPath && (
                  <span className="text-[10px] text-muted-foreground/50">—</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {paths.length === 0 ? (
            <div className="text-center py-12">
              <GitCompare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No paths found between the selected nodes.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                They may not be connected in this graph.
              </p>
            </div>
          ) : (
            <div>
              {/* Mode description */}
              {activePath && (
                <div className="mb-4 flex items-start gap-2">
                  <div
                    className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                    style={{ backgroundColor: activePath.color }}
                  />
                  <div>
                    <p className="text-sm font-medium">{activePath.name}</p>
                    <p className="text-xs text-muted-foreground">{activePath.description}</p>
                  </div>
                </div>
              )}

              {/* Identical-path notice */}
              {allPathsIdentical && (
                <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Only one path exists between these nodes — all three modes traverse the same route.
                    Add more papers to create alternative paths for meaningful comparison.
                  </p>
                </div>
              )}

              {/* Path chain */}
              {activePath ? (
                <PathChain path={activePath} />
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No {currentMode} path found between these nodes.
                </div>
              )}

              {/* Quick stats comparing modes */}
              {paths.length > 1 && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Mode Comparison</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {(["shortest", "conflict", "consensus"] as PathMode[]).map((mode) => {
                      const config = MODE_CONFIG[mode];
                      const p = pathsByMode[mode];
                      const hops = p?.nodes?.length ? p.nodes.length - 1 : 0;
                      const conflicts = p?.edges?.filter((e) => e.type === "contradicts").length || 0;
                      const supports = p?.edges?.filter((e) => e.type === "supports").length || 0;

                      return (
                        <div
                          key={mode}
                          className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                            currentMode === mode ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                          }`}
                          onClick={() => onModeChange?.(mode)}
                        >
                          <p className="text-lg font-bold">{hops || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">{config.label}</p>
                          {hops > 0 && (
                            <div className="flex items-center justify-center gap-2 mt-1">
                              {supports > 0 && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                  {supports}✓
                                </span>
                              )}
                              {conflicts > 0 && (
                                <span className="text-[10px] text-red-600 dark:text-red-400">
                                  {conflicts}✗
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ContainedPanelContent>
    </ContainedPanel>
  );
}
