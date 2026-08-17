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
      <DialogContent
        className="sm:max-w-[420px]"
        data-testid="onboarding-dialog"
      >
        {/* Badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase shadow-lg dark:border-slate-600 dark:bg-slate-700">
          New User Guide
        </div>

        <DialogHeader>
          <div className="mb-4 flex items-center justify-between">
            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
              <Network className="text-primary h-5 w-5" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold">
            How to read the graph
          </DialogTitle>
          <p className="text-muted-foreground pt-2 text-sm">
            Welcome to Ithaca. Here is a quick guide to understanding the visual
            grammar of our citation networks.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-6 pt-4">
          {/* Nodes Explanation */}
          <div className="flex items-start gap-4">
            <div className="flex w-12 justify-center pt-1">
              <div className="bg-primary/20 flex size-8 items-center justify-center rounded-full">
                <div className="bg-primary size-4 rounded-full" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="mb-1 text-sm font-bold">Nodes (Papers)</h4>
              <p className="text-muted-foreground mb-3 text-xs">
                Size indicates citation count. Color indicates publication year.
              </p>
              <div className="bg-muted/50 flex items-center gap-6 rounded-lg border p-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-8 items-end gap-2">
                    <div className="bg-primary/40 size-3 rounded-full" />
                    <div className="bg-primary/70 size-6 rounded-full" />
                    <div className="bg-primary size-8 rounded-full shadow-sm" />
                  </div>
                  <span className="text-muted-foreground text-[10px] font-medium uppercase">
                    Citations
                  </span>
                </div>
                <div className="bg-border h-10 w-px" />
                <div className="flex flex-1 flex-col items-center gap-2">
                  <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-200 via-blue-400 to-blue-800" />
                  <div className="text-muted-foreground flex w-full justify-between text-[10px] font-medium uppercase">
                    <span>Old</span>
                    <span>New</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edges Explanation */}
          <div className="flex items-start gap-4">
            <div className="flex w-12 justify-center pt-1">
              <TrendingUp className="text-muted-foreground h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="mb-1 text-sm font-bold">Edges (Connections)</h4>
              <p className="text-muted-foreground mb-3 text-xs">
                Lines represent the sentiment of the citation.
              </p>
              <div className="bg-muted/50 flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="bg-supports h-1 w-12 rounded-full" />
                  <span className="text-xs font-semibold">Support</span>
                  <div className="bg-supports/20 ml-auto flex size-4 items-center justify-center rounded-full">
                    <div className="bg-supports size-2 rounded-full" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-contradicts h-1 w-12 rounded-full" />
                  <span className="text-xs font-semibold">
                    Refute / Disagree
                  </span>
                  <div className="bg-contradicts/20 ml-auto flex size-4 items-center justify-center rounded-full">
                    <X className="text-contradicts size-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button
          data-testid="onboarding-complete-button"
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
