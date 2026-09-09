"use client";

import React from "react";
import { Network, Orbit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/stores/canvas-store";

interface SchoolsViewControlProps {
  className?: string;
  schoolCount?: number;
}

/**
 * SchoolsViewControl — Toolbar toggle switching between detailed paper constellation
 * and high-level "Schools of Thought" macro-clusters.
 */
export function SchoolsViewControl({
  className,
  schoolCount = 0,
}: SchoolsViewControlProps) {
  const clusterViewMode = useCanvasStore((s) => s.clusterViewMode);
  const setClusterViewMode = useCanvasStore((s) => s.setClusterViewMode);

  return (
    <div
      className={cn(
        "bg-card/95 border-border inline-flex items-center gap-0.5 rounded-full border p-1 shadow-lg backdrop-blur-md",
        className,
      )}
    >
      <button
        onClick={() => setClusterViewMode("papers")}
        title="View individual paper constellation"
        className={cn(
          "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
          clusterViewMode === "papers"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        )}
      >
        <Network className="h-3.5 w-3.5" />
        <span>Papers</span>
      </button>

      <button
        onClick={() => setClusterViewMode("schools")}
        title="Group papers into high-level Schools of Thought macro-clusters"
        className={cn(
          "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
          clusterViewMode === "schools"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        )}
      >
        <Orbit className="h-3.5 w-3.5" />
        <span>Schools</span>
        {schoolCount > 0 && (
          <span
            className={cn(
              "py-0.2 ml-0.5 rounded-full px-1.5 text-[10px] leading-none font-bold",
              clusterViewMode === "schools"
                ? "bg-white text-indigo-700"
                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
            )}
          >
            {schoolCount}
          </span>
        )}
      </button>
    </div>
  );
}
