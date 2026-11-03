"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Sparkles, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LabQuickstartProps {
  collapsed?: boolean;
}

export function LabQuickstart({ collapsed }: LabQuickstartProps) {
  const [dismissed, setDismissed] = useState(true);
  const [completedSteps, setCompletedSteps] = useState({
    workspace: true,
    explored: false,
    battlefield: false,
    collection: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDismissed = localStorage.getItem("ithaca_lab_quickstart_dismissed");
    if (!isDismissed) {
      setDismissed(false);
    }

    // Check progress
    const hasExplored = Boolean(localStorage.getItem("ithaca_has_explored"));
    const hasBattlefield = Boolean(localStorage.getItem("ithaca_has_battlefield"));
    const hasCollection = Boolean(localStorage.getItem("ithaca_has_collection"));

    setCompletedSteps({
      workspace: true,
      explored: hasExplored,
      battlefield: hasBattlefield,
      collection: hasCollection,
    });
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("ithaca_lab_quickstart_dismissed", "true");
  };

  if (dismissed || collapsed) {
    return null;
  }

  const stepsList = [
    {
      id: "workspace",
      label: "Lab workspace allocated",
      done: true,
      href: "/dashboard",
    },
    {
      id: "explored",
      label: "Explore your first debate map",
      done: completedSteps.explored,
      href: "/explore",
    },
    {
      id: "battlefield",
      label: "Activate Battlefield Mode",
      done: completedSteps.battlefield,
      href: "/explore",
    },
    {
      id: "collection",
      label: "Create a watched collection",
      done: completedSteps.collection,
      href: "/projects",
    },
  ];

  const completedCount = stepsList.filter((s) => s.done).length;
  const progressPercent = Math.round((completedCount / stepsList.length) * 100);

  return (
    <div className="mx-2 my-2 rounded-xl border border-primary/25 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-3 shadow-sm transition-all">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary animate-pulse" />
          <span className="text-xs font-bold tracking-tight text-foreground">
            Lab Quickstart
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-muted-foreground">
            {completedCount}/{stepsList.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            title="Dismiss quickstart"
          >
            <X className="size-3" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="mt-2.5 space-y-1.5">
        {stepsList.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className="group flex items-center justify-between rounded-md px-1.5 py-1 text-[11px] transition-colors hover:bg-muted/60"
          >
            <div className="flex items-center gap-2 truncate">
              {step.done ? (
                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="size-3.5 text-muted-foreground/50 shrink-0" />
              )}
              <span
                className={`truncate ${
                  step.done
                    ? "line-through text-muted-foreground/70"
                    : "text-foreground font-medium group-hover:text-primary"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!step.done && (
              <ChevronRight className="size-3 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary shrink-0" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
