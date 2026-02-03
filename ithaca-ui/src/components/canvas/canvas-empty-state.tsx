"use client";

import { Search, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface CanvasEmptyStateProps {
  /** Callback when user clicks the search prompt */
  onSearchClick?: () => void;
  /** Optional custom message */
  message?: string;
  /** Whether to show the animated background */
  showAnimation?: boolean;
}

/**
 * Empty state shown when the graph canvas has no data to display.
 * Guides users to search for papers or explore the knowledge graph.
 */
export function CanvasEmptyState({
  onSearchClick,
  message = "Start exploring the research landscape",
  showAnimation = true,
}: CanvasEmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      {/* Animated background pattern */}
      {showAnimation && (
        <div className="absolute inset-0 overflow-hidden opacity-[0.03] dark:opacity-[0.05]">
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

      {/* Decorative floating nodes */}
      {showAnimation && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-primary/10"
              initial={{
                x: `${20 + i * 15}%`,
                y: `${30 + (i % 3) * 20}%`,
                scale: 0.5 + (i % 3) * 0.3,
              }}
              animate={{
                y: [`${30 + (i % 3) * 20}%`, `${35 + (i % 3) * 20}%`],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-md px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Icon with glow effect */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150" />
          <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-2xl border border-primary/10">
            <Search className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          No graph loaded
        </h2>

        {/* Message */}
        <p className="text-muted-foreground mb-6 leading-relaxed">{message}</p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button size="lg" className="gap-2 group" onClick={onSearchClick}>
            <Search className="w-4 h-4" />
            Search for papers
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        {/* Feature hints */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-left">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">AI-Powered Insights</p>
              <p className="text-xs text-muted-foreground">
                Ask questions about the research
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <BookOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Citation Paths</p>
              <p className="text-xs text-muted-foreground">
                Discover how papers connect
              </p>
            </div>
          </div>
        </div>
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
