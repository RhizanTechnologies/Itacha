"use client";

import * as React from "react";
import { Network, TrendingUp, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function OnboardingDialog({
  open,
  onOpenChange,
  onComplete,
}: OnboardingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        {/* Badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-slate-700 dark:border-slate-600">
          New User Guide
        </div>

        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Network className="h-5 w-5 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold">
            How to read the graph
          </DialogTitle>
          <p className="text-sm text-muted-foreground pt-2">
            Welcome to Ithaca. Here is a quick guide to understanding the visual
            grammar of our citation networks.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-6 pt-4">
          {/* Nodes Explanation */}
          <div className="flex items-start gap-4">
            <div className="w-12 pt-1 flex justify-center">
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="size-4 rounded-full bg-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold mb-1">Nodes (Papers)</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Size indicates citation count. Color indicates publication year.
              </p>
              <div className="flex items-center gap-6 p-3 bg-muted/50 rounded-lg border">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-end gap-2 h-8">
                    <div className="size-3 rounded-full bg-primary/40" />
                    <div className="size-6 rounded-full bg-primary/70" />
                    <div className="size-8 rounded-full bg-primary shadow-sm" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                    Citations
                  </span>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-200 via-blue-400 to-blue-800" />
                  <div className="flex justify-between w-full text-[10px] font-medium text-muted-foreground uppercase">
                    <span>Old</span>
                    <span>New</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edges Explanation */}
          <div className="flex items-start gap-4">
            <div className="w-12 pt-1 flex justify-center">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold mb-1">Edges (Connections)</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Lines represent the sentiment of the citation.
              </p>
              <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-12 bg-supports rounded-full" />
                  <span className="text-xs font-semibold">Support</span>
                  <div className="ml-auto size-4 rounded-full bg-supports/20 flex items-center justify-center">
                    <div className="size-2 rounded-full bg-supports" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1 w-12 bg-contradicts rounded-full" />
                  <span className="text-xs font-semibold">Refute / Disagree</span>
                  <div className="ml-auto size-4 rounded-full bg-contradicts/20 flex items-center justify-center">
                    <X className="size-3 text-contradicts" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={onComplete}
          className="mt-6 h-11 font-bold tracking-wide"
        >
          Get Started
          <TrendingUp className="ml-2 h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
