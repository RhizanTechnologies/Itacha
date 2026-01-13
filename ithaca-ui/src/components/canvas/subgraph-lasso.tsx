"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lasso,
  X,
  Download,
  Share2,
  BookmarkPlus,
  ZoomIn,
  Eye,
  MousePointer2,
} from "lucide-react";

interface LassoSelection {
  points: { x: number; y: number }[];
  nodeIds: string[];
}

interface SubgraphLassoToolProps {
  isActive: boolean;
  onToggle: () => void;
  onSelectionComplete: (selection: LassoSelection) => void;
  selectedNodes?: string[];
}

export function SubgraphLassoTool({
  isActive,
  onToggle,
  onSelectionComplete,
  selectedNodes = [],
}: SubgraphLassoToolProps) {
  return (
    <>
      {/* Lasso Toggle Button */}
      <button
        onClick={onToggle}
        className={`absolute top-16 right-4 z-30 flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg transition-all ${
          isActive
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card/90 backdrop-blur border-border hover:bg-muted"
        }`}
      >
        <Lasso className="h-4 w-4" />
        <span className="text-sm font-medium">
          {isActive ? "Selecting..." : "Lasso Select"}
        </span>
      </button>

      {/* Selection Panel */}
      {selectedNodes.length > 0 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur border border-border rounded-xl shadow-2xl p-4 min-w-80 animate-in slide-in-from-bottom-4 fade-in">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm">Selection</h3>
              <p className="text-xs text-muted-foreground">
                {selectedNodes.length} nodes selected
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onSelectionComplete({ points: [], nodeIds: [] })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected Node Preview */}
          <div className="flex flex-wrap gap-1 mb-4 max-h-20 overflow-y-auto">
            {selectedNodes.slice(0, 10).map((nodeId) => (
              <Badge key={nodeId} variant="secondary" className="text-xs">
                {nodeId}
              </Badge>
            ))}
            {selectedNodes.length > 10 && (
              <Badge variant="outline" className="text-xs">
                +{selectedNodes.length - 10} more
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" size="sm" className="flex-col h-auto py-2 gap-1">
              <ZoomIn className="h-4 w-4" />
              <span className="text-[10px]">Focus</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-col h-auto py-2 gap-1">
              <Eye className="h-4 w-4" />
              <span className="text-[10px]">Isolate</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-col h-auto py-2 gap-1">
              <BookmarkPlus className="h-4 w-4" />
              <span className="text-[10px]">Save</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-col h-auto py-2 gap-1">
              <Download className="h-4 w-4" />
              <span className="text-[10px]">Export</span>
            </Button>
          </div>
        </div>
      )}

      {/* Instructions Toast */}
      {isActive && selectedNodes.length === 0 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 text-sm">
            <MousePointer2 className="h-4 w-4" />
            <span>Click and drag to select nodes</span>
          </div>
        </div>
      )}
    </>
  );
}

// Lasso Drawing Canvas (SVG overlay)
export function LassoDrawingCanvas({
  isDrawing,
  points,
}: {
  isDrawing: boolean;
  points: { x: number; y: number }[];
}) {
  if (!isDrawing || points.length < 2) return null;

  const pathData = points.reduce((acc, point, i) => {
    return acc + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
  }, "");

  return (
    <svg
      className="absolute inset-0 z-20 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    >
      {/* Lasso path */}
      <path
        d={pathData}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeDasharray="5,5"
        className="animate-dash"
      />
      {/* Fill area */}
      <path
        d={pathData + " Z"}
        fill="hsl(var(--primary) / 0.1)"
        stroke="none"
      />
      {/* Start point indicator */}
      {points.length > 0 && (
        <circle
          cx={points[0].x}
          cy={points[0].y}
          r="6"
          fill="hsl(var(--primary))"
          className="animate-pulse"
        />
      )}
    </svg>
  );
}
