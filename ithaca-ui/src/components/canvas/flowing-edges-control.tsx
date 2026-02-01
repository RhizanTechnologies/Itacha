"use client";

import { Waves } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlowingEdgesControlProps {
  /** Whether flowing edge animations are enabled */
  enabled: boolean;
  /** Toggle callback */
  onToggle: () => void;
}

/**
 * Toggle control for flowing edge animations.
 * Shows a wave icon that indicates animation state.
 */
export function FlowingEdgesControl({
  enabled,
  onToggle,
}: FlowingEdgesControlProps) {
  return (
    <Button
      variant={enabled ? "default" : "outline"}
      size="icon"
      onClick={onToggle}
      className={`h-8 w-8 transition-all ${
        enabled
          ? "bg-primary/90 text-primary-foreground shadow-sm"
          : "bg-card/80 hover:bg-card"
      }`}
      aria-label={enabled ? "Disable flowing edges" : "Enable flowing edges"}
      aria-pressed={enabled}
      title={`${enabled ? "Disable" : "Enable"} flowing edge animations`}
    >
      <Waves className={`h-4 w-4 ${enabled ? "animate-pulse" : ""}`} />
    </Button>
  );
}
