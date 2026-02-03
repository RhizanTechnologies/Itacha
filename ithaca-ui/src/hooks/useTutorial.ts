"use client";

import { useState, useCallback, useEffect } from "react";
import { debug } from "@/lib/debug";

/**
 * Tutorial step definition
 */
export interface TutorialStep {
  /** Unique identifier for the step */
  id: string;
  /** Title displayed in the tooltip */
  title: string;
  /** Description/instructions for the step */
  description: string;
  /** CSS selector or predefined target for the spotlight */
  target?: string | "canvas" | "search" | "filters" | "chat" | "share";
  /** Position of the tooltip relative to target */
  position?: "top" | "bottom" | "left" | "right" | "center";
  /** Optional action that triggers auto-advance */
  advanceOn?: "click" | "next" | "auto";
  /** Delay before auto-advance (if advanceOn is "auto") */
  autoAdvanceDelay?: number;
  /** Whether to highlight the entire canvas */
  highlightCanvas?: boolean;
  /** Custom spotlight dimensions (optional) */
  spotlightPadding?: number;
}

/**
 * Tutorial configuration
 */
export interface TutorialConfig {
  /** Unique identifier for this tutorial */
  id: string;
  /** Display name of the tutorial */
  name: string;
  /** Steps in the tutorial */
  steps: TutorialStep[];
  /** Whether to show skip button */
  showSkip?: boolean;
  /** Whether to show progress indicator */
  showProgress?: boolean;
  /** Callback when tutorial completes */
  onComplete?: () => void;
}

/**
 * Default canvas exploration tutorial
 */
export const CANVAS_TUTORIAL: TutorialConfig = {
  id: "canvas-exploration",
  name: "Canvas Exploration",
  showSkip: true,
  showProgress: true,
  steps: [
    {
      id: "welcome",
      title: "Welcome to Ithaca",
      description:
        "Explore scientific research through interactive citation networks. Let's take a quick tour of the key features.",
      position: "center",
      advanceOn: "next",
    },
    {
      id: "search",
      title: "Start with Search",
      description:
        "Use the command bar (⌘K) to search for papers, topics, or researchers. Your search becomes the center of your graph.",
      target: "search",
      position: "bottom",
      advanceOn: "next",
    },
    {
      id: "canvas",
      title: "The Citation Graph",
      description:
        "Each node is a paper. Edges show citation relationships. Colored edges indicate support (green), contradiction (red), or extension (blue).",
      target: "canvas",
      position: "center",
      highlightCanvas: true,
      advanceOn: "next",
    },
    {
      id: "navigation",
      title: "Navigate the Graph",
      description:
        "Drag to pan, scroll to zoom. Click nodes to see details. Use arrow keys for keyboard navigation. Press + and - to zoom.",
      target: "canvas",
      position: "center",
      advanceOn: "next",
    },
    {
      id: "filters",
      title: "Filter Your View",
      description:
        "Use filters to focus on specific time periods, citation counts, or paper types. Hide or show nodes to reduce clutter.",
      target: "filters",
      position: "right",
      advanceOn: "next",
    },
    {
      id: "chat",
      title: "Ask AI",
      description:
        "Chat with the AI assistant about your graph, ask questions about papers, or get research recommendations.",
      target: "chat",
      position: "left",
      advanceOn: "next",
    },
    {
      id: "selection",
      title: "Select & Compare",
      description:
        "Press S to enter selection mode. Click nodes to select them, then compare, focus, or export your selection.",
      target: "canvas",
      position: "center",
      advanceOn: "next",
    },
    {
      id: "share",
      title: "Share & Export",
      description:
        "Export your graph as an image, PDF, or data file. Generate a shareable link to collaborate with others.",
      target: "share",
      position: "top",
      advanceOn: "next",
    },
    {
      id: "shortcuts",
      title: "Keyboard Shortcuts",
      description:
        "Press ? anytime to see all keyboard shortcuts. Use them to navigate efficiently without leaving your keyboard.",
      position: "center",
      advanceOn: "next",
    },
    {
      id: "complete",
      title: "You're Ready!",
      description:
        "That's the basics. Start exploring by searching for a topic that interests you. Happy researching!",
      position: "center",
      advanceOn: "next",
    },
  ],
};

/**
 * Storage key for tutorial completion state
 */
const TUTORIAL_STORAGE_KEY = "ithaca_tutorials_completed";

/**
 * Hook for managing tutorial state
 */
export function useTutorial(config: TutorialConfig) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  // Check if user has already completed this tutorial
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (storedData) {
        const completed = JSON.parse(storedData) as string[];
        if (completed.includes(config.id)) {
          setHasSeenTutorial(true);
        }
      }
    } catch (e) {
      debug.error("Failed to check tutorial state:", e);
    }
  }, [config.id]);

  const currentStep = config.steps[currentStepIndex] || null;
  const isLastStep = currentStepIndex === config.steps.length - 1;
  const progress =
    config.steps.length > 0
      ? ((currentStepIndex + 1) / config.steps.length) * 100
      : 0;

  const start = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
    debug.log("Tutorial started:", config.id);
  }, [config.id]);

  const next = useCallback(() => {
    if (isLastStep) {
      complete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [isLastStep]);

  const previous = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < config.steps.length) {
        setCurrentStepIndex(index);
      }
    },
    [config.steps.length],
  );

  const skip = useCallback(() => {
    setIsActive(false);
    debug.log("Tutorial skipped:", config.id);
  }, [config.id]);

  const complete = useCallback(() => {
    setIsActive(false);
    setHasSeenTutorial(true);

    // Save completion to localStorage
    try {
      const storedData = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      const completed = storedData ? (JSON.parse(storedData) as string[]) : [];
      if (!completed.includes(config.id)) {
        completed.push(config.id);
        localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(completed));
      }
    } catch (e) {
      debug.error("Failed to save tutorial completion:", e);
    }

    config.onComplete?.();
    debug.log("Tutorial completed:", config.id);
  }, [config]);

  const reset = useCallback(() => {
    setHasSeenTutorial(false);
    setCurrentStepIndex(0);

    // Remove from localStorage
    try {
      const storedData = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (storedData) {
        const completed = JSON.parse(storedData) as string[];
        const filtered = completed.filter((id) => id !== config.id);
        localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (e) {
      debug.error("Failed to reset tutorial:", e);
    }
  }, [config.id]);

  return {
    // State
    isActive,
    currentStep,
    currentStepIndex,
    isLastStep,
    progress,
    hasSeenTutorial,
    totalSteps: config.steps.length,

    // Actions
    start,
    next,
    previous,
    goToStep,
    skip,
    complete,
    reset,
  };
}

/**
 * Get target element for a step
 */
export function getTutorialTarget(
  target?: TutorialStep["target"],
): HTMLElement | null {
  if (!target) return null;

  switch (target) {
    case "canvas":
      return document.querySelector(".react-sigma") as HTMLElement;
    case "search":
      return (
        (document.querySelector("[data-tutorial='search']") as HTMLElement) ||
        (document.querySelector("[cmdk-root]") as HTMLElement)
      );
    case "filters":
      return document.querySelector("[data-tutorial='filters']") as HTMLElement;
    case "chat":
      return document.querySelector("[data-tutorial='chat']") as HTMLElement;
    case "share":
      return document.querySelector("[data-tutorial='share']") as HTMLElement;
    default:
      return document.querySelector(target) as HTMLElement;
  }
}
