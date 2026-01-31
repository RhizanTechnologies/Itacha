/**
 * Contained Panel Component
 * 
 * A slide-over panel that stays WITHIN its parent container,
 * rather than using fixed positioning on the viewport.
 * Used for canvas overlays that shouldn't overlap the chat panel.
 */

"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// CONTAINED PANEL
// =============================================================================

interface ContainedPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "right" | "left" | "bottom";
  className?: string;
  title?: string;
  description?: string;
}

export function ContainedPanel({
  open,
  onOpenChange,
  children,
  side = "right",
  className,
}: ContainedPanelProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop - contained within parent */}
      <div
        className="absolute inset-0 z-40 bg-black/30 backdrop-blur-[2px] animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div
        className={cn(
          "absolute z-50 bg-background shadow-2xl flex flex-col",
          "animate-in duration-300 ease-out",
          side === "right" && "inset-y-0 right-0 w-full max-w-xl border-l slide-in-from-right",
          side === "left" && "inset-y-0 left-0 w-full max-w-xl border-r slide-in-from-left",
          side === "bottom" && "inset-x-0 bottom-0 h-[60%] border-t slide-in-from-bottom",
          className
        )}
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {children}
      </div>
    </>
  );
}

// =============================================================================
// CONTAINED PANEL HEADER
// =============================================================================

interface ContainedPanelHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ContainedPanelHeader({ children, className }: ContainedPanelHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 p-6 pb-4", className)}>
      {children}
    </div>
  );
}

// =============================================================================
// CONTAINED PANEL TITLE
// =============================================================================

interface ContainedPanelTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function ContainedPanelTitle({ children, className }: ContainedPanelTitleProps) {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  );
}

// =============================================================================
// CONTAINED PANEL DESCRIPTION
// =============================================================================

interface ContainedPanelDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function ContainedPanelDescription({ children, className }: ContainedPanelDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
}

// =============================================================================
// CONTAINED PANEL CONTENT
// =============================================================================

interface ContainedPanelContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ContainedPanelContent({ children, className }: ContainedPanelContentProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-6 pt-0", className)}>
      {children}
    </div>
  );
}

// =============================================================================
// CONTAINED PANEL FOOTER
// =============================================================================

interface ContainedPanelFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ContainedPanelFooter({ children, className }: ContainedPanelFooterProps) {
  return (
    <div className={cn("mt-auto border-t p-4 flex gap-2 justify-end", className)}>
      {children}
    </div>
  );
}
