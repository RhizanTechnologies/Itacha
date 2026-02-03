"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard, X } from "lucide-react";
import { KEYBOARD_SHORTCUTS } from "@/hooks/useCanvasKeyboard";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal showing all available keyboard shortcuts
 */
export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Navigate and control the graph canvas with your keyboard
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-4">
          {KEYBOARD_SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <kbd className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-xs font-mono font-semibold bg-muted border border-border rounded-md shadow-sm">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t text-xs text-muted-foreground">
          <p>
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">?</kbd>{" "}
            anytime to show this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Floating button to show keyboard shortcuts
 * Appears in bottom-left of canvas
 */
export function KeyboardShortcutsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-8 h-8 bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg hover:bg-muted transition-colors"
      title="Keyboard shortcuts (?)"
      aria-label="Show keyboard shortcuts"
    >
      <Keyboard className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
