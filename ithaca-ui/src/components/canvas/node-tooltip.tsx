"use client";

import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TooltipState {
  label: string;
  cluster: number;
  visible: boolean;
}

export function NodeTooltip() {
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  const [tooltip, setTooltip] = useState<TooltipState>({
    label: "",
    cluster: 0,
    visible: false,
  });

  useEffect(() => {
    registerEvents({
      enterNode: (event) => {
        const nodeData = sigma.getGraph().getNodeAttributes(event.node);
        // Get node position in screen coordinates
        // Note: This is an approximation. Real implementation needs sigma's camera to viewport conversion.
        // For M3, we'll just fix it to a corner or follow mouse if possible.
        // Better: just show it fixed in top right like an "Inspector"
        
        setTooltip({
          label: nodeData.label,
          cluster: nodeData.cluster,
          visible: true,
        });
      },
      leaveNode: () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
      },
    });
  }, [registerEvents, sigma]);

  if (!tooltip.visible) return null;

  return (
    <div className="absolute top-4 right-4 z-10 w-64 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
      <Card className="bg-background/90 backdrop-blur shadow-lg border-primary/20">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-bold">{tooltip.label}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 text-sm text-muted-foreground">
           <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-primary" />
             <span>Cluster {tooltip.cluster}</span>
           </div>
           <p className="mt-2">ID: {tooltip.label}</p>
        </CardContent>
      </Card>
    </div>
  );
}
