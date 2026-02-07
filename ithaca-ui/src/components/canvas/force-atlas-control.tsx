"use client";

import { useEffect, useState } from "react";
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { Play, Pause, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ANIMATION } from "@/lib/constants";

interface ForceAtlasControlProps {
  autoStart?: boolean;
  externalIsRunning?: boolean;
  onToggle?: () => void;
  nodeCount?: number;
}

export function ForceAtlasControl({
  autoStart = true,
  externalIsRunning,
  onToggle,
  nodeCount = 0,
}: ForceAtlasControlProps) {
  // Adaptive settings based on graph size
  const getOptimalSettings = (count: number) => {
    if (count > 10000) {
      // Large graphs: prioritize performance
      return {
        slowDown: 15,
        gravity: 2,
        scalingRatio: 2,
        barnesHutOptimize: true,
        barnesHutTheta: 0.8,
        adjustSizes: false,
        edgeWeightInfluence: 0,
        strongGravityMode: true,
      };
    } else if (count > 5000) {
      // Medium graphs: balance quality and performance
      return {
        slowDown: 12,
        gravity: 3,
        scalingRatio: 1.5,
        barnesHutOptimize: true,
        barnesHutTheta: 0.6,
        adjustSizes: true,
        edgeWeightInfluence: 0.5,
        strongGravityMode: true,
      };
    } else {
      // Small graphs: prioritize quality, keep compact
      return {
        slowDown: 10,
        gravity: 5,
        scalingRatio: 1,
        barnesHutOptimize: true,
        barnesHutTheta: 0.5,
        adjustSizes: true,
        edgeWeightInfluence: 1,
        strongGravityMode: true,
        linLogMode: false,
      };
    }
  };

  const { start, stop, kill, isRunning } = useWorkerLayoutForceAtlas2({
    settings: getOptimalSettings(nodeCount),
  });

  const [internalisActive, setInternalIsActive] = useState(autoStart);

  // Use external state if provided, otherwise internal
  const isActive =
    externalIsRunning !== undefined ? externalIsRunning : internalisActive;

  // Sync worker with state
  useEffect(() => {
    if (isActive && !isRunning) {
      start();
    } else if (!isActive && isRunning) {
      stop();
    }
  }, [isActive, isRunning, start, stop]);

  // Auto-start on mount, auto-stop after stabilization period
  useEffect(() => {
    start();
    const timeout = setTimeout(() => {
      stop();
      setInternalIsActive(false);
    }, ANIMATION.LAYOUT_STABILIZE);
    return () => {
      kill();
      clearTimeout(timeout);
    };
  }, [start, stop, kill]);

  const toggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsActive(!internalisActive);
    }
  };

  return (
    <div className="react-sigma-control">
      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={toggle}
          className="bg-background/95 backdrop-blur-sm border-border shadow-sm h-[30px] w-[30px]"
          title={isActive ? "Stop Layout" : "Start Layout"}
        >
          {isActive ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        
        {/* Settings indicator */}
        {nodeCount > 5000 && (
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-md px-2 py-1 text-xs text-muted-foreground">
            <Sliders className="h-3 w-3 inline mr-1" />
            Optimized
          </div>
        )}
      </div>
    </div>
  );
}
