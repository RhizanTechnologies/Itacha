/**
 * Performance Monitor Control Component
 * 
 * Displays real-time performance metrics for the graph canvas.
 * Shows FPS, render time, memory usage, and performance warnings.
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
} from "lucide-react";
import type { PerformanceMetrics } from "@/lib/performance";

interface PerformanceMonitorControlProps {
  metrics: PerformanceMetrics | null;
  isMonitoring: boolean;
  onToggle: () => void;
}

export function PerformanceMonitorControl({
  metrics,
  isMonitoring,
  onToggle,
}: PerformanceMonitorControlProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!metrics) return null;

  const fps = Math.round(metrics.fps);
  const frameTime = metrics.avgFrameTime.toFixed(2);
  const memoryMB = metrics.memoryUsage?.toFixed(1);

  // Determine performance status
  const getPerformanceStatus = () => {
    if (fps >= 50) return { color: "text-green-500", icon: CheckCircle, label: "Excellent" };
    if (fps >= 30) return { color: "text-yellow-500", icon: AlertTriangle, label: "Good" };
    return { color: "text-red-500", icon: TrendingDown, label: "Poor" };
  };

  const status = getPerformanceStatus();
  const StatusIcon = status.icon;

  return (
    <div className="react-sigma-control">
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-sm p-2 space-y-2 min-w-[200px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Performance</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide" : "Show"}
          </Button>
        </div>

        {/* Compact View */}
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${status.color}`} />
          <div className="flex-1">
            <div className="text-lg font-bold">{fps} FPS</div>
            <div className="text-xs text-muted-foreground">{status.label}</div>
          </div>
        </div>

        {/* Detailed Metrics */}
        {showDetails && (
          <div className="space-y-1 pt-2 border-t border-border/50">
            <MetricRow label="Frame Time" value={`${frameTime}ms`} />
            <MetricRow label="Nodes" value={metrics.nodeCount.toLocaleString()} />
            <MetricRow label="Edges" value={metrics.edgeCount.toLocaleString()} />
            {memoryMB && <MetricRow label="Memory" value={`${memoryMB}MB`} />}
            <MetricRow label="Renders" value={metrics.renderCount.toString()} />
          </div>
        )}

        {/* Performance Badges */}
        <div className="flex gap-1 flex-wrap">
          {fps < 30 && (
            <Badge variant="destructive" className="text-xs px-2 py-0">
              Low FPS
            </Badge>
          )}
          {metrics.nodeCount > 10000 && (
            <Badge variant="outline" className="text-xs px-2 py-0">
              Large Graph
            </Badge>
          )}
          {metrics.memoryUsage && metrics.memoryUsage > 500 && (
            <Badge variant="outline" className="text-xs px-2 py-0 border-yellow-500 text-yellow-600">
              High Memory
            </Badge>
          )}
        </div>

        {/* Toggle Button */}
        <Button
          variant={isMonitoring ? "default" : "outline"}
          size="sm"
          className="w-full text-xs"
          onClick={onToggle}
        >
          {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
        </Button>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
