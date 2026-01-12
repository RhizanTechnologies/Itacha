"use client";

import { useEffect, useState } from "react";
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { Play, Pause, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ForceAtlasControl() {
  const { start, stop, kill, isRunning } = useWorkerLayoutForceAtlas2({
    settings: {
      slowDown: 10,
      gravity: 1, // Weak gravity to allow expansion
      scalingRatio: 2, // Spread out nodes
      barnesHutOptimize: true, // For performance with large graphs
    },
  });

  const [isActive, setIsActive] = useState(true);

  // Auto-start on mount, auto-stop after 2 seconds to stabilize
  useEffect(() => {
    start();
    const timeout = setTimeout(() => {
        stop();
        setIsActive(false);
    }, 2000);
    return () => {
      kill();
      clearTimeout(timeout);
    };
  }, [start, stop, kill]);

  const toggle = () => {
    if (isActive) {
      stop();
      setIsActive(false);
    } else {
      start();
      setIsActive(true);
    }
  };

  return (
    <div className="react-sigma-control">
      <Button
         variant="outline"
         size="icon"
         onClick={toggle}
         className="bg-background/80 backdrop-blur border-border shadow-sm h-[30px] w-[30px]"
         title={isActive ? "Stop Layout" : "Start Layout"}
      >
        {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
    </div>
  );
}
