"use client";

import { CheckCircle, XCircle, ArrowRightCircle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export type RelationshipFocusType = "all" | "supports" | "contradicts" | "extends";

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
];

/**
 * RelationshipFocusControl — lets the user choose which relationship type
 * to focus on when searching. "All" fetches everything; a specific type
 * filters results to only show that relationship, giving a denser,
 * more relevant graph.
 */
export function RelationshipFocusControl({
  value,
  onChange,
}: RelationshipFocusControlProps) {
  return (
    <div className="flex items-center bg-card/90 backdrop-blur border border-border rounded-lg shadow-lg overflow-hidden">
      {OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.label}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all",
              isActive
                ? opt.activeColor
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{opt.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
