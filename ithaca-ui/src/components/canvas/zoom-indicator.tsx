"use client";

import { useSigma, useCamera } from "@react-sigma/core";
import { useEffect, useState, useCallback } from "react";
import { Minus, Plus, Crosshair } from "lucide-react";

export function ZoomIndicator() {
  const sigma = useSigma();
  const { gotoNode, reset } = useCamera();
  const [zoomLevel, setZoomLevel] = useState(100);

  // Track zoom level changes
  useEffect(() => {
    const camera = sigma.getCamera();
    
    const updateZoom = () => {
      // Camera ratio is inverse of zoom (smaller = more zoomed in)
      const ratio = camera.ratio;
      const percent = Math.round((1 / ratio) * 100);
      setZoomLevel(Math.min(600, Math.max(10, percent)));
    };

    // Initial update
    updateZoom();

    // Listen for camera updates
    camera.on("updated", updateZoom);
    
    return () => {
      camera.off("updated", updateZoom);
    };
  }, [sigma]);

  const handleZoomIn = useCallback(() => {
    const camera = sigma.getCamera();
    camera.animatedZoom({ duration: 200 });
  }, [sigma]);

  const handleZoomOut = useCallback(() => {
    const camera = sigma.getCamera();
    camera.animatedUnzoom({ duration: 200 });
  }, [sigma]);

  const handleReset = useCallback(() => {
    const camera = sigma.getCamera();
    camera.animate({ ratio: 1, x: 0.5, y: 0.5 }, { duration: 300 });
  }, [sigma]);

  // Determine zoom "zone" for display styling
  const getZoomZone = () => {
    if (zoomLevel <= 150) return "linear";
    if (zoomLevel <= 600) return "logarithmic";
    return "micro";
  };

  const zone = getZoomZone();

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 bg-card/90 backdrop-blur border border-border rounded-full shadow-2xl">
      {/* Zoom Out */}
      <button
        onClick={handleZoomOut}
        className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Zoom Out"
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* Zoom Level Display */}
      <div className="px-3 min-w-[60px] text-center">
        <span className="text-foreground text-xs font-mono font-medium">
          {zoomLevel}%
        </span>
        {zone !== "linear" && (
          <span className="block text-[9px] text-muted-foreground uppercase">
            {zone}
          </span>
        )}
      </div>

      {/* Zoom In */}
      <button
        onClick={handleZoomIn}
        className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Zoom In"
      >
        <Plus className="h-4 w-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-4 bg-border mx-1" />

      {/* Reset/Center */}
      <button
        onClick={handleReset}
        className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Reset View"
      >
        <Crosshair className="h-4 w-4" />
      </button>
    </div>
  );
}
