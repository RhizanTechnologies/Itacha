"use client";

import { useEffect } from "react";
import { SigmaContainer, ControlsContainer, ZoomControl, FullScreenControl, useLoadGraph } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import { useTheme } from "next-themes";
import { loadMockGraph } from "@/lib/graph/mock-data";
import Graph from "graphology";
import { ForceAtlasControl } from "@/components/canvas/force-atlas-control";
import { NodeTooltip } from "@/components/canvas/node-tooltip";

function LoadGraph() {
  const loadGraph = useLoadGraph();

  useEffect(() => {
    const graph = new Graph();
    loadMockGraph(graph);
    loadGraph(graph);
  }, [loadGraph]);

  return null;
}

export function ExploreCanvas() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="h-full w-full">
       <SigmaContainer 
         style={{ height: "100%", width: "100%", background: isDark ? "#0B0C10" : "#F6F7F8" }}
         settings={{
            allowInvalidContainer: true,
            renderLabels: true,
            labelRenderedSizeThreshold: 6,
            labelDensity: 0.07,
            labelGridCellSize: 60,
            labelColor: { color: isDark ? "#fff" : "#000" },
            zIndex: true,
         }}
       >
         <LoadGraph />
         <ControlsContainer position={"bottom-right"}>
            <ZoomControl />
            <FullScreenControl />
            <ForceAtlasControl />
         </ControlsContainer>
         <NodeTooltip />
       </SigmaContainer>
    </div>
  );
}
