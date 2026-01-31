/**
 * Graph Worker Client
 *
 * Client-side interface for communicating with the graph calculation worker.
 * Provides type-safe async API for offloading computations.
 */

import type { FilterState } from "@/components/filters/global-filters";
import type { PathMode } from "@/lib/graph-algorithms";
import type {
  WorkerMessage,
  WorkerResponse,
  WorkerMessageType,
} from "@/workers/graph-worker";
import { debug } from "@/lib/debug";

// =============================================================================
// WORKER CLIENT CLASS
// =============================================================================

export class GraphWorkerClient {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingMessages = new Map<
    string,
    {
      resolve: (data: any) => void;
      reject: (error: Error) => void;
    }
  >();

  /**
   * Initialize the worker
   */
  async initialize(): Promise<void> {
    if (this.worker) {
      debug.graph("Worker already initialized");
      return;
    }

    try {
      // Create worker from file
      this.worker = new Worker(
        new URL("@/workers/graph-worker.ts", import.meta.url),
        { type: "module" },
      );

      // Set up message handler
      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, success, data, error, duration } = event.data;

        const pending = this.pendingMessages.get(id);
        if (!pending) {
          debug.warn("Received response for unknown message ID:", id);
          return;
        }

        this.pendingMessages.delete(id);

        if (success) {
          debug.graph(`Worker completed in ${duration?.toFixed(2)}ms`);
          pending.resolve(data);
        } else {
          pending.reject(new Error(error || "Worker error"));
        }
      };

      // Handle worker errors
      this.worker.onerror = (error) => {
        debug.error("Worker error:", error);
        this.pendingMessages.forEach(({ reject }) => {
          reject(new Error("Worker crashed"));
        });
        this.pendingMessages.clear();
      };

      debug.graph("Graph worker initialized");
    } catch (error) {
      debug.error("Failed to initialize worker:", error);
      throw error;
    }
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      debug.graph("Worker terminated");
    }

    // Reject all pending messages
    this.pendingMessages.forEach(({ reject }) => {
      reject(new Error("Worker terminated"));
    });
    this.pendingMessages.clear();
  }

  /**
   * Send message to worker and await response
   */
  private async sendMessage<T = any>(
    type: WorkerMessageType,
    payload: any,
  ): Promise<T> {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    const id = `msg_${++this.messageId}`;

    return new Promise<T>((resolve, reject) => {
      this.pendingMessages.set(id, { resolve, reject });

      const message: WorkerMessage = { id, type, payload };
      this.worker!.postMessage(message);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error("Worker timeout"));
        }
      }, 30000);
    });
  }

  /**
   * Initialize graph data in worker
   */
  async initGraph(
    nodes: any[],
    edges: any[],
  ): Promise<{
    nodeCount: number;
    edgeCount: number;
  }> {
    return this.sendMessage("INIT_GRAPH", { nodes, edges });
  }

  /**
   * Calculate layout iteration
   */
  async calculateLayout(
    settings: any,
    iterations: number,
  ): Promise<{
    positions: Record<string, { x: number; y: number }>;
  }> {
    return this.sendMessage("CALCULATE_LAYOUT", { settings, iterations });
  }

  /**
   * Find path between nodes
   */
  async findPath(
    startId: string,
    endId: string,
    mode: PathMode,
  ): Promise<{
    path: Array<{ node: string; edge?: string }> | null;
  }> {
    return this.sendMessage("FIND_PATH", { startId, endId, mode });
  }

  /**
   * Apply filters to graph
   */
  async applyFilters(filters: FilterState): Promise<{
    visibleNodes: string[];
    hiddenNodes: string[];
    visibleCount: number;
    hiddenCount: number;
  }> {
    return this.sendMessage("APPLY_FILTERS", { filters });
  }

  /**
   * Calculate graph clusters
   */
  async calculateClusters(algorithm: string): Promise<{
    clusters: Record<string, number>;
  }> {
    return this.sendMessage("CALCULATE_CLUSTERS", { algorithm });
  }

  /**
   * Extract subgraph around nodes
   */
  async getSubgraph(
    nodeIds: string[],
    depth: number,
  ): Promise<{
    nodes: any[];
    edges: any[];
  }> {
    return this.sendMessage("GET_SUBGRAPH", { nodeIds, depth });
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let workerInstance: GraphWorkerClient | null = null;

/**
 * Get or create worker instance
 */
export function getGraphWorker(): GraphWorkerClient {
  if (!workerInstance) {
    workerInstance = new GraphWorkerClient();
  }
  return workerInstance;
}

/**
 * Cleanup worker on page unload
 */
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (workerInstance) {
      workerInstance.terminate();
      workerInstance = null;
    }
  });
}
