"use client";

import { Loader2 } from "lucide-react";

interface CanvasLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

/**
 * A loading overlay that appears over the canvas during data fetching operations.
 * Uses a subtle backdrop to maintain context while indicating loading state.
 */
export function CanvasLoadingOverlay({
  isLoading,
  message = "Loading graph data...",
}: CanvasLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/50 backdrop-blur-sm transition-opacity duration-300">
      <div className="flex flex-col items-center gap-3 rounded-lg bg-card/95 p-6 shadow-lg border border-border">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for the canvas while initial data is loading.
 * Shows a pulsing effect to indicate activity.
 */
export function CanvasSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      {/* Animated dot pattern to suggest graph nodes */}
      <div className="relative w-full h-full overflow-hidden">
        {/* Central cluster */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            {/* Central node */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary/30 animate-pulse" />
            
            {/* Surrounding nodes */}
            {[...Array(6)].map((_, i) => {
              const angle = (i * 60 * Math.PI) / 180;
              const radius = 60;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <div
                  key={i}
                  className="absolute w-3 h-3 rounded-full bg-muted-foreground/20 animate-pulse"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: "translate(-50%, -50%)",
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              );
            })}

            {/* Connection lines */}
            <svg
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 opacity-20"
              viewBox="-80 -80 160 160"
            >
              {[...Array(6)].map((_, i) => {
                const angle = (i * 60 * Math.PI) / 180;
                const x = Math.cos(angle) * 60;
                const y = Math.sin(angle) * 60;
                
                return (
                  <line
                    key={i}
                    x1="0"
                    y1="0"
                    x2={x}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Loading text */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Initializing visualization...</p>
        </div>
      </div>
    </div>
  );
}
