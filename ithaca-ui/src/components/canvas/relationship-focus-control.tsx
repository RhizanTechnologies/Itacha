"use client";

import {
  CheckCircle,
  XCircle,
  ArrowRightCircle,
  Layers,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useCanvasStore } from "@/stores/canvas-store";

export type RelationshipFocusType =
  "all" | "supports" | "contradicts" | "extends" | "cites";

interface RelationshipFocusControlProps {
  value: RelationshipFocusType;
  onChange: (value: RelationshipFocusType) => void;
  className?: string;
  extra?: React.ReactNode;
  counts?: {
    all: number;
    supports: number;
    contradicts: number;
    extends: number;
    cites: number;
  };
}

const OPTIONS: {
  value: RelationshipFocusType;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  activeColor: string;
}[] = [
  {
    value: "all",
    label: "All Types",
    shortLabel: "All",
    icon: Layers,
    activeColor: "bg-primary text-primary-foreground",
  },
  {
    value: "supports",
    label: "Supports Only",
    shortLabel: "Supports",
    icon: CheckCircle,
    activeColor: "bg-emerald-600 text-white",
  },
  {
    value: "contradicts",
    label: "Refutes Only",
    shortLabel: "Refutes",
    icon: XCircle,
    activeColor: "bg-red-600 text-white",
  },
  {
    value: "extends",
    label: "Extends Only",
    shortLabel: "Extends",
    icon: ArrowRightCircle,
    activeColor: "bg-blue-600 text-white",
  },
  {
    value: "cites",
    label: "Cites Only",
    shortLabel: "Cites",
    icon: Link2,
    activeColor: "bg-zinc-500 text-white",
  },
];

/**
 * RelationshipFocusControl — tab-style mode switcher.
 * Positioned at bottom-center like a proper navigation control.
 */
export function RelationshipFocusControl({
  value,
  onChange,
  className,
  extra,
  counts: propCounts,
}: RelationshipFocusControlProps) {
  const storeCounts = useCanvasStore((s) => s.dialecticCounts);
  const totalEdges = useCanvasStore((s) => s.graphStats.edgeCount);
  const counts = propCounts || {
    all: totalEdges,
    ...storeCounts,
  };

  return (
    <div
      className={cn(
        "bg-card/95 border-border inline-flex items-center gap-0.5 rounded-full border p-1 shadow-lg backdrop-blur-md",
        className,
      )}
    >
      <div className="flex items-center gap-0.5">
        {OPTIONS.map((opt) => {
          const isActive = value === opt.value;
          const Icon = opt.icon;
          const count = counts?.[opt.value];
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              title={opt.label}
              className={cn(
                "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                isActive
                  ? cn(opt.activeColor, "shadow-sm")
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{opt.shortLabel}</span>
              {typeof count === "number" && counts.all > 0 && (
                <span
                  className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {extra && (
        <>
          <div className="bg-border/60 mx-1 h-4 w-px" />
          {extra}
        </>
      )}
    </div>
  );
}
