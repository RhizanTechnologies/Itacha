"use client";

import { CheckCircle, XCircle, ArrowRightCircle, Layers, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type RelationshipFocusType = "all" | "supports" | "contradicts" | "extends" | "cites";

interface RelationshipFocusControlProps {
  value: RelationshipFocusType;
  onChange: (value: RelationshipFocusType) => void;
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
}: RelationshipFocusControlProps) {
  return (
    <div className="inline-flex items-center bg-card/95 backdrop-blur-md border border-border rounded-full shadow-lg p-1 gap-0.5">
      {OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.label}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200",
              isActive
                ? cn(opt.activeColor, "shadow-sm")
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{opt.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
