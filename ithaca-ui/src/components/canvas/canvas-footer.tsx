"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  Keyboard,
  Sparkles,
  BookOpen,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GraphLegend } from "@/components/filters/global-filters";

// =============================================================================
// CANVAS FOOTER - Unified bottom-left zone component
// =============================================================================

interface CanvasFooterProps {
  // Graph stats
  nodeCount: number;
  edgeCount: number;
  status?: "live" | "loading" | "error";

  // Actions
  onKeyboardHelpClick: () => void;
  onTutorialClick: () => void;
  onTutorialRestart?: () => void;
  hasSeenTutorial: boolean;
}

/**
 * Unified footer component for the canvas bottom-left zone.
 * Combines Legend, Status, and Help buttons in a collapsible layout.
 */
export function CanvasFooter({
  nodeCount,
  edgeCount,
  status = "live",
  onKeyboardHelpClick,
  onTutorialClick,
  onTutorialRestart,
  hasSeenTutorial,
}: CanvasFooterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {/* Collapsible Legend - only shows when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <GraphLegend />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main footer bar */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2",
          "bg-card/90 backdrop-blur-sm border border-border",
          "rounded-lg shadow-lg",
        )}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1",
            "text-xs text-muted-foreground",
            "hover:text-foreground hover:bg-muted/50",
            "rounded transition-colors",
          )}
          title={isExpanded ? "Hide legend" : "Show legend"}
        >
          <BookOpen className="w-3.5 h-3.5" />
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3" />
          )}
        </button>

        {/* Separator */}
        <div className="h-4 w-px bg-border" />

        {/* Stats indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <StatusDot status={status} />
          <span className="font-medium tabular-nums hidden md:inline">
            {nodeCount.toLocaleString()} nodes
          </span>
          <span className="text-muted-foreground/50 hidden md:inline">•</span>
          <span className="font-medium tabular-nums hidden md:inline">
            {edgeCount.toLocaleString()} edges
          </span>
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-border" />

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Keyboard shortcuts */}
          <button
            onClick={onKeyboardHelpClick}
            className={cn(
              "flex items-center justify-center w-7 h-7",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-muted/50 rounded transition-colors",
            )}
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Tutorial */}
          <TutorialButton
            hasSeenTutorial={hasSeenTutorial}
            onClick={onTutorialClick}
            onRestart={onTutorialRestart}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatusDot({ status }: { status: "live" | "loading" | "error" }) {
  const colors = {
    live: "bg-emerald-500",
    loading: "bg-amber-500 animate-pulse",
    error: "bg-red-500",
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-1.5 h-1.5 rounded-full", colors[status])} />
    </div>
  );
}

function TutorialButton({
  hasSeenTutorial,
  onClick,
  onRestart,
}: {
  hasSeenTutorial: boolean;
  onClick: () => void;
  onRestart?: () => void;
}) {
  const handleClick = () => {
    if (hasSeenTutorial && onRestart) {
      onRestart();
    }
    onClick();
  };

  if (!hasSeenTutorial) {
    // First time user - prominent button
    return (
      <motion.button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1",
          "bg-primary text-primary-foreground",
          "rounded-md shadow-sm",
          "text-xs font-medium",
          "hover:bg-primary/90 transition-colors",
        )}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Tour
      </motion.button>
    );
  }

  // Returning user - subtle icon
  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center w-7 h-7",
        "text-muted-foreground hover:text-primary",
        "hover:bg-muted/50 rounded transition-colors",
      )}
      title="Restart tutorial"
    >
      <Sparkles className="w-4 h-4" />
    </button>
  );
}
