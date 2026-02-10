"use client";

import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { RelationshipFocusType } from "@/components/canvas/relationship-focus-control";

interface CanvasEmptyStateProps {
  /** Callback when user clicks the search prompt */
  onSearchClick?: () => void;
  /** Optional custom message */
  message?: string;
  /** Whether to show the animated background */
  showAnimation?: boolean;
  /** Current relationship focus */
  relationshipFocus?: RelationshipFocusType;
  /** Callback when relationship focus changes */
  onRelationshipFocusChange?: (focus: RelationshipFocusType) => void;
}

/**
 * Empty state shown when the graph canvas has no data to display.
 * Guides users to search for papers or explore the knowledge graph.
 */
export function CanvasEmptyState({
  onSearchClick,
  message = "Start exploring the research landscape",
  showAnimation = true,
  relationshipFocus = "all",
  onRelationshipFocusChange,
}: CanvasEmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      {/* Subtle dot grid — grounded, not starfield */}
      {showAnimation && (
        <div className="absolute inset-0 overflow-hidden opacity-[0.04] dark:opacity-[0.06]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="empty-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="20" cy="20" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#empty-grid)" />
          </svg>
        </div>
      )}

      {/* Main content — focused, single CTA hierarchy */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-sm px-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Icon */}
        <div className="relative mb-5">
          <div className="bg-primary/10 p-5 rounded-2xl border border-primary/10">
            <Search className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Explore citation networks
        </h2>

        {/* Message */}
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-xs">{message}</p>

        {/* Primary CTA — owns the screen */}
        <Button size="lg" className="gap-2 group w-full max-w-xs" onClick={onSearchClick}>
          <Search className="w-4 h-4" />
          Search for papers
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>

        {/* Keyboard hint */}
        <p className="mt-3 text-xs text-muted-foreground">
          or press <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">⌘K</kbd>
        </p>
      </motion.div>
    </div>
  );
}

/**
 * Compact empty state for inline usage (e.g., search results, filters)
 */
export function EmptyStateCompact({
  message = "No results found",
  suggestion,
}: {
  message?: string;
  suggestion?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted/50 p-4 rounded-full mb-4">
        <Search className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
      {suggestion && (
        <p className="text-xs text-muted-foreground mt-1">{suggestion}</p>
      )}
    </div>
  );
}
