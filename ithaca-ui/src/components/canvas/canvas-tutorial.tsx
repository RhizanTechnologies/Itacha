"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { TutorialStep } from "@/hooks/useTutorial";
import { getTutorialTarget } from "@/hooks/useTutorial";

interface TutorialOverlayProps {
  /** Whether the tutorial is active */
  isActive: boolean;
  /** Current step to display */
  step: TutorialStep | null;
  /** Current step index */
  stepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Progress percentage */
  progress: number;
  /** Whether this is the last step */
  isLastStep: boolean;
  /** Whether to show skip button */
  showSkip?: boolean;
  /** Whether to show progress */
  showProgress?: boolean;
  /** Go to next step */
  onNext: () => void;
  /** Go to previous step */
  onPrevious: () => void;
  /** Skip/close the tutorial */
  onSkip: () => void;
}

interface TooltipPosition {
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  transform?: string;
}

/**
 * Tutorial overlay with spotlight and tooltip
 */
export function TutorialOverlay({
  isActive,
  step,
  stepIndex,
  totalSteps,
  progress,
  isLastStep,
  showSkip = true,
  showProgress = true,
  onNext,
  onPrevious,
  onSkip,
}: TutorialOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Find and track target element
  useEffect(() => {
    if (!isActive || !step) {
      setTargetRect(null);
      return;
    }

    const updateTargetRect = () => {
      const target = getTutorialTarget(step.target);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateTargetRect();

    // Update on resize/scroll
    const handleUpdate = () => requestAnimationFrame(updateTargetRect);
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [isActive, step]);

  // Calculate tooltip position
  useEffect(() => {
    if (!isActive || !step) return;

    // Mobile: Always force bottom-center position context-style
    if (isMobile) {
      setTooltipPosition({
        bottom: 24,
        left: 16,
        right: 16,
        transform: "none",
      });
      return;
    }

    const position = step.position || "center";
    const padding = step.spotlightPadding || 8;

    if (!targetRect || position === "center") {
      // Center on screen
      setTooltipPosition({
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      });
      return;
    }

    const tooltipWidth = 360;
    const tooltipHeight = 180;
    const margin = 16;

    let pos: TooltipPosition = {};

    switch (position) {
      case "top":
        pos = {
          top: targetRect.top - tooltipHeight - margin,
          left: targetRect.left + targetRect.width / 2,
          transform: "translateX(-50%)",
        };
        break;
      case "bottom":
        pos = {
          top: targetRect.bottom + margin,
          left: targetRect.left + targetRect.width / 2,
          transform: "translateX(-50%)",
        };
        break;
      case "left":
        pos = {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left - tooltipWidth - margin,
          transform: "translateY(-50%)",
        };
        break;
      case "right":
        pos = {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + margin,
          transform: "translateY(-50%)",
        };
        break;
    }

    // Clamp to viewport
    if (typeof pos.top === "number") {
      pos.top = Math.max(
        margin,
        Math.min(pos.top, window.innerHeight - tooltipHeight - margin),
      );
    }
    if (typeof pos.left === "number") {
      pos.left = Math.max(
        margin,
        Math.min(pos.left, window.innerWidth - tooltipWidth - margin),
      );
    }

    setTooltipPosition(pos);
  }, [isActive, step, targetRect]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onSkip();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        onNext();
      } else if (e.key === "ArrowLeft" && stepIndex > 0) {
        onPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, stepIndex, onNext, onPrevious, onSkip]);

  if (!isActive || !step) return null;

  const spotlightPadding = step.spotlightPadding || 8;

  return (
    <AnimatePresence>
      <motion.div
        className="pointer-events-auto fixed inset-0 z-[100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop with spotlight cutout */}
        <div className="absolute inset-0">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Spotlight cutout (if we have a target) */}
          {targetRect && !step.highlightCanvas && (
            <motion.div
              className="absolute bg-transparent"
              style={{
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
                borderRadius: 8,
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                top: targetRect.top - spotlightPadding,
                left: targetRect.left - spotlightPadding,
                width: targetRect.width + spotlightPadding * 2,
                height: targetRect.height + spotlightPadding * 2,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          )}
        </div>

        {/* Tooltip */}
        <motion.div
          ref={tooltipRef}
          className={cn(
            "absolute z-[101] w-full max-w-[calc(100vw-32px)] md:w-[360px]",
            "bg-card border-border rounded-xl border shadow-2xl",
            "p-5",
          )}
          style={tooltipPosition}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          key={step.id}
        >
          {/* Header */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 rounded-lg p-1.5">
                <Sparkles className="text-primary h-4 w-4" />
              </div>
              <h3 className="text-foreground text-base font-semibold">
                {step.title}
              </h3>
            </div>
            {showSkip && (
              <button
                onClick={onSkip}
                className="hover:bg-muted -mt-1 -mr-1 rounded p-1 transition-colors"
                aria-label="Close tutorial"
              >
                <X className="text-muted-foreground h-4 w-4" />
              </button>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
            {step.description}
          </p>

          {/* Footer: Progress + Navigation */}
          <div className="flex items-center justify-between">
            {/* Progress */}
            {showProgress ? (
              <div className="flex items-center gap-2">
                <div className="bg-muted h-1.5 w-24 overflow-hidden rounded-full">
                  <motion.div
                    className="bg-primary h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-muted-foreground text-xs">
                  {stepIndex + 1} / {totalSteps}
                </span>
              </div>
            ) : (
              <div />
            )}

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrevious}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={onNext} className="gap-1">
                {isLastStep ? "Finish" : "Next"}
                {!isLastStep && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Pulse animation around target */}
        {targetRect && !step.highlightCanvas && (
          <motion.div
            className="pointer-events-none absolute"
            style={{
              top: targetRect.top - spotlightPadding - 4,
              left: targetRect.left - spotlightPadding - 4,
              width: targetRect.width + (spotlightPadding + 4) * 2,
              height: targetRect.height + (spotlightPadding + 4) * 2,
              borderRadius: 12,
              border: "2px solid",
              borderColor: "rgba(139, 92, 246, 0.5)",
            }}
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(139, 92, 246, 0.4)",
                "0 0 0 8px rgba(139, 92, 246, 0)",
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Tutorial start/restart button
 * - First-time users: Prominent "Take a Tour" button
 * - Returning users: Subtle icon button to restart
 */
export function TutorialStartButton({
  onClick,
  onRestart,
  hasSeenTutorial,
}: {
  onClick: () => void;
  onRestart?: () => void;
  hasSeenTutorial: boolean;
}) {
  const handleClick = () => {
    if (hasSeenTutorial && onRestart) {
      // Reset tutorial state first, then start
      onRestart();
    }
    onClick();
  };

  // First-time user: Prominent button
  if (!hasSeenTutorial) {
    return (
      <motion.button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 px-3 py-2",
          "bg-primary text-primary-foreground",
          "rounded-lg shadow-lg",
          "text-sm font-medium",
          "hover:bg-primary/90 transition-colors",
        )}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.3 }}
      >
        <Sparkles className="h-4 w-4" />
        Take a Tour
      </motion.button>
    );
  }

  // Returning user: Subtle restart button
  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center",
        "bg-card/90 border-border border backdrop-blur-sm",
        "rounded-lg shadow-lg",
        "hover:bg-muted transition-colors",
        "group",
      )}
      title="Restart tutorial"
      aria-label="Restart tutorial"
    >
      <Sparkles className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
    </button>
  );
}
