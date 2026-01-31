/**
 * Performance Monitoring Utilities
 * 
 * Provides tools for profiling Sigma.js graph rendering and interactions.
 * Tracks frame rates, render times, and memory usage for large graphs.
 */

import { debug } from "./debug";

// =============================================================================
// TYPES
// =============================================================================

export interface PerformanceMetrics {
  fps: number;
  avgFrameTime: number;
  maxFrameTime: number;
  minFrameTime: number;
  renderCount: number;
  nodeCount: number;
  edgeCount: number;
  memoryUsage?: number; // MB
  timestamp: number;
}

export interface GraphPerformanceReport {
  nodeCount: number;
  edgeCount: number;
  avgFps: number;
  avgRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  totalFrames: number;
  duration: number; // seconds
  memoryDelta?: number; // MB
  bottlenecks: string[];
}

// =============================================================================
// PERFORMANCE MONITOR CLASS
// =============================================================================

export class GraphPerformanceMonitor {
  private frameTimes: number[] = [];
  private renderTimes: number[] = [];
  private startTime: number = 0;
  private lastFrameTime: number = 0;
  private nodeCount: number = 0;
  private edgeCount: number = 0;
  private isMonitoring: boolean = false;
  private animationFrameId: number | null = null;
  private startMemory: number = 0;

  constructor() {
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
  }

  /**
   * Start monitoring performance
   */
  start(nodeCount: number, edgeCount: number): void {
    this.nodeCount = nodeCount;
    this.edgeCount = edgeCount;
    this.isMonitoring = true;
    this.frameTimes = [];
    this.renderTimes = [];
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;

    // Capture initial memory if available
    if ((performance as any).memory) {
      this.startMemory = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }

    debug.graph(`Performance monitoring started: ${nodeCount} nodes, ${edgeCount} edges`);
    
    this.trackFrames();
  }

  /**
   * Stop monitoring and return report
   */
  stop(): GraphPerformanceReport {
    this.isMonitoring = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const duration = (performance.now() - this.startTime) / 1000;
    const avgFps = this.frameTimes.length / duration;
    const avgRenderTime = this.average(this.renderTimes);
    const maxRenderTime = Math.max(...this.renderTimes);
    const minRenderTime = Math.min(...this.renderTimes);

    let memoryDelta: number | undefined;
    if ((performance as any).memory) {
      const endMemory = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      memoryDelta = endMemory - this.startMemory;
    }

    const bottlenecks = this.identifyBottlenecks(avgFps, avgRenderTime);

    const report: GraphPerformanceReport = {
      nodeCount: this.nodeCount,
      edgeCount: this.edgeCount,
      avgFps,
      avgRenderTime,
      maxRenderTime,
      minRenderTime,
      totalFrames: this.frameTimes.length,
      duration,
      memoryDelta,
      bottlenecks,
    };

    debug.graph("Performance report:", report);
    return report;
  }

  /**
   * Mark a render cycle
   */
  markRender(renderTime: number): void {
    if (!this.isMonitoring) return;
    this.renderTimes.push(renderTime);
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): PerformanceMetrics | null {
    if (!this.isMonitoring || this.frameTimes.length === 0) return null;

    const recentFrames = this.frameTimes.slice(-60); // Last second at 60fps
    const avgFrameTime = this.average(recentFrames);
    const fps = 1000 / avgFrameTime;

    let memoryUsage: number | undefined;
    if ((performance as any).memory) {
      memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }

    return {
      fps,
      avgFrameTime,
      maxFrameTime: Math.max(...recentFrames),
      minFrameTime: Math.min(...recentFrames),
      renderCount: this.renderTimes.length,
      nodeCount: this.nodeCount,
      edgeCount: this.edgeCount,
      memoryUsage,
      timestamp: performance.now(),
    };
  }

  /**
   * Track frames using requestAnimationFrame
   */
  private trackFrames = (): void => {
    if (!this.isMonitoring) return;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.frameTimes.push(frameTime);
    this.lastFrameTime = now;

    this.animationFrameId = requestAnimationFrame(this.trackFrames);
  };

  /**
   * Calculate average of an array
   */
  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(avgFps: number, avgRenderTime: number): string[] {
    const bottlenecks: string[] = [];

    if (avgFps < 30) {
      bottlenecks.push("Low FPS: Consider reducing node count or enabling virtualization");
    }

    if (avgRenderTime > 16.67) {
      bottlenecks.push("Slow render times: Frame budget exceeded for 60fps");
    }

    if (this.nodeCount > 10000) {
      bottlenecks.push("High node count: Consider implementing data virtualization");
    }

    if (this.edgeCount > 50000) {
      bottlenecks.push("High edge count: Consider edge bundling or filtering");
    }

    const nodeEdgeRatio = this.edgeCount / this.nodeCount;
    if (nodeEdgeRatio > 10) {
      bottlenecks.push("High edge density: Graph may be too connected for efficient rendering");
    }

    if ((performance as any).memory) {
      const memoryMB = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      if (memoryMB > 500) {
        bottlenecks.push("High memory usage: Consider memory optimization strategies");
      }
    }

    return bottlenecks;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Measure execution time of a function
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  debug.graph(`${label}: ${duration.toFixed(2)}ms`);
  
  return { result, duration };
}

/**
 * Measure execution time of a synchronous function
 */
export function measure<T>(
  label: string,
  fn: () => T
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  debug.graph(`${label}: ${duration.toFixed(2)}ms`);
  
  return { result, duration };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// =============================================================================
// GRAPH SIZE RECOMMENDATIONS
// =============================================================================

export interface GraphSizeRecommendation {
  maxNodes: number;
  maxEdges: number;
  recommendVirtualization: boolean;
  recommendWebWorker: boolean;
  recommendEdgeBundling: boolean;
  estimatedFps: number;
  warnings: string[];
}

/**
 * Get performance recommendations based on graph size
 */
export function getGraphSizeRecommendations(
  nodeCount: number,
  edgeCount: number
): GraphSizeRecommendation {
  const warnings: string[] = [];
  let recommendVirtualization = false;
  let recommendWebWorker = false;
  let recommendEdgeBundling = false;
  let estimatedFps = 60;

  // Node count thresholds
  if (nodeCount > 5000) {
    recommendVirtualization = true;
    warnings.push("Graph has >5k nodes. Consider implementing viewport-based rendering.");
    estimatedFps = Math.max(30, 60 - (nodeCount - 5000) / 100);
  }

  if (nodeCount > 10000) {
    recommendWebWorker = true;
    warnings.push("Graph has >10k nodes. Move layout calculations to WebWorker.");
    estimatedFps = Math.max(15, 30 - (nodeCount - 10000) / 200);
  }

  // Edge count thresholds
  if (edgeCount > 20000) {
    recommendEdgeBundling = true;
    warnings.push("Graph has >20k edges. Consider edge bundling or aggressive filtering.");
    estimatedFps = Math.min(estimatedFps, 30);
  }

  // Edge density
  const density = nodeCount > 0 ? edgeCount / nodeCount : 0;
  if (density > 15) {
    warnings.push("Graph is very dense (avg degree > 15). Consider subgraph extraction.");
    estimatedFps = Math.min(estimatedFps, 20);
  }

  return {
    maxNodes: nodeCount,
    maxEdges: edgeCount,
    recommendVirtualization,
    recommendWebWorker,
    recommendEdgeBundling,
    estimatedFps,
    warnings,
  };
}
