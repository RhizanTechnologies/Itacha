"use client";

import React from "react";
import { Swords, Landmark, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore, type CanvasPerspective } from "@/stores/canvas-store";

interface PerspectiveControlProps {
  className?: string;
  disputeCount?: number;
  upstreamCount?: number;
}

const PERSPECTIVES: {
  value: CanvasPerspective;
  label: string;
  shortLabel: string;
  tooltip: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}[] = [
  {
    value: "battlefield",
    label: "Battlefield",
    shortLabel: "Battlefield",
    tooltip:
      "The Crucible: Pure debate (refutations, confirmations, extensions). Prunes upstream bibliography noise.",
    icon: Swords,
    activeClass:
      "bg-red-600 text-white shadow-lg ring-2 shadow-red-500/30 ring-red-400/50",
  },
  {
    value: "foundations",
    label: "Lineage",
    shortLabel: "Lineage",
    tooltip:
      "Foundational Roots: Seminal literature, prior axioms, and datasets the author built upon.",
    icon: Landmark,
    activeClass:
      "bg-amber-600 text-white shadow-lg ring-2 shadow-amber-500/30 ring-amber-400/50",
  },
  {
    value: "synthesis",
    label: "360° Synthesis",
    shortLabel: "360°",
    tooltip:
      "Full Ecosystem: Tri-Hemispheric River layout with West = Roots and East = Debates.",
    icon: Globe,
    activeClass:
      "bg-indigo-600 text-white shadow-lg ring-2 shadow-indigo-500/30 ring-indigo-400/50",
  },
];

/**
 * PerspectiveControl — First-class perspective switcher.
 * Allows scholars to transition between the controversy crucible,
 * foundational lineage, and the full 360° synthesis.
 */
export function PerspectiveControl({
  className,
  disputeCount = 0,
  upstreamCount = 0,
}: PerspectiveControlProps) {
  const perspective = useCanvasStore((s) => s.perspective);
  const setPerspective = useCanvasStore((s) => s.setPerspective);

  return (
    <div
      className={cn(
        "bg-card/95 border-border inline-flex items-center gap-0.5 rounded-full border p-1 shadow-lg backdrop-blur-md",
        className,
      )}
    >
      {PERSPECTIVES.map((item) => {
        const isActive = perspective === item.value;
        const Icon = item.icon;

        return (
          <button
            key={item.value}
            onClick={() => setPerspective(item.value)}
            title={item.tooltip}
            className={cn(
              "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300",
              isActive
                ? item.activeClass
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
            )}
          >
            <Icon
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-300",
                isActive && item.value === "battlefield" && "scale-110 rotate-12",
                isActive && item.value === "foundations" && "scale-110",
                isActive && item.value === "synthesis" && "scale-110 rotate-45",
              )}
            />
            <span>{item.shortLabel}</span>

            {/* Badges */}
            {item.value === "battlefield" && disputeCount > 0 && (
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] leading-none font-bold",
                  isActive
                    ? "bg-white text-red-700"
                    : "bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300",
                )}
              >
                {disputeCount}
              </span>
            )}

            {item.value === "foundations" && upstreamCount > 0 && (
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] leading-none font-bold",
                  isActive
                    ? "bg-white text-amber-800"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300",
                )}
              >
                {upstreamCount}
              </span>
            )}

            {/* Pulse dot for active battlefield */}
            {isActive && item.value === "battlefield" && (
              <span className="relative ml-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-200 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
