"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Share2,
  Copy,
  Check,
  Download,
  Image,
  FileJson,
  Twitter,
  Mail,
  Loader2,
  FileCode,
  Table,
  Eye,
  X,
  Sparkles,
} from "lucide-react";
import {
  exportGraph,
  type ExportFormat,
  type ExportMetadata,
} from "@/lib/graph-export";
import type { Sigma } from "sigma";
import type Graph from "graphology";
import { cn } from "@/lib/utils";

interface ShareExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  graphTitle?: string;
  graphDescription?: string;
  searchQuery?: string;
  nodeCount?: number;
  edgeCount?: number;
  sigma?: Sigma | null;
  graph?: Graph | null;
}

/**
 * Generate a shareable link for the graph
 * TODO: Replace with actual backend API call to create persistent share link
 */
async function generateShareLink(graphId: string): Promise<string> {
  // In production, this would call the backend API
  // POST /api/graphs/share { graphId }
  // Returns { shareUrl: "https://ithaca.app/share/abc123" }

  // For now, generate a deterministic mock URL based on graphId
  const hash = graphId.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  return `https://ithaca.app/graph/share/${Math.abs(hash).toString(36)}`;
}

/**
 * Export graph as PNG using canvas capture
 * Captures all Sigma canvas layers and combines them
 */
async function exportAsPNG(title: string): Promise<void> {
  // Sigma uses multiple canvas layers - find them all
  const container = document.querySelector(".react-sigma");

  if (!container) {
    // Fallback to any sigma-related container
    const anyContainer = document.querySelector('[class*="sigma"]');
    if (!anyContainer) {
      throw new Error("Sigma container not found");
    }
  }

  // Find all canvases in the Sigma container
  const canvases = document.querySelectorAll(
    ".react-sigma canvas, [class*='sigma'] canvas",
  );

  if (canvases.length === 0) {
    throw new Error("No canvas found for export");
  }

  // Get dimensions from the first canvas
  const firstCanvas = canvases[0] as HTMLCanvasElement;
  const width = firstCanvas.width || firstCanvas.offsetWidth * 2;
  const height = firstCanvas.height || firstCanvas.offsetHeight * 2;

  // Create a combined canvas
  const combinedCanvas = document.createElement("canvas");
  combinedCanvas.width = width;
  combinedCanvas.height = height;
  const ctx = combinedCanvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  // Fill with background color (detect dark mode)
  const isDark = document.documentElement.classList.contains("dark");
  ctx.fillStyle = isDark ? "#0B0C10" : "#F6F7F8";
  ctx.fillRect(0, 0, width, height);

  // Draw each canvas layer on top
  canvases.forEach((canvas) => {
    if (canvas instanceof HTMLCanvasElement) {
      try {
        ctx.drawImage(canvas, 0, 0);
      } catch (e) {
        console.warn("Could not draw canvas layer:", e);
      }
    }
  });

  // Export the combined canvas
  const dataUrl = combinedCanvas.toDataURL("image/png");
  downloadFile(dataUrl, `${sanitizeFilename(title)}.png`);
}

/**
 * Export graph data as JSON
 */
async function exportAsJSON(
  title: string,
  nodeCount: number,
  edgeCount: number,
): Promise<void> {
  // In production, this would fetch the actual graph data from state/API
  const graphData = {
    title,
    exportedAt: new Date().toISOString(),
    stats: { nodeCount, edgeCount },
    // TODO: Include actual nodes and edges from graph state
    nodes: [],
    edges: [],
    metadata: {
      version: "1.0",
      format: "ithaca-graph",
    },
  };

  const blob = new Blob([JSON.stringify(graphData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  downloadFile(url, `${sanitizeFilename(title)}.json`);
  URL.revokeObjectURL(url);
}

function downloadFile(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-");
}

export function ShareExportDialog({
  open,
  onOpenChange,
  graphTitle = "Citation Network",
  graphDescription,
  searchQuery,
  nodeCount = 0,
  edgeCount = 0,
  sigma,
  graph,
}: ShareExportProps) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<ExportFormat>("png");
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Build metadata for exports
  const exportMetadata: ExportMetadata = {
    title: graphTitle,
    description: graphDescription,
    query: searchQuery,
    nodeCount,
    edgeCount,
    timestamp: new Date().toISOString(),
  };

  // Generate share link when dialog opens
  const handleGenerateLink = useCallback(async () => {
    setIsGeneratingLink(true);
    setError(null);
    try {
      const url = await generateShareLink(graphTitle);
      setShareUrl(url);
    } catch (err) {
      setError("Failed to generate share link");
      console.error(err);
    } finally {
      setIsGeneratingLink(false);
    }
  }, [graphTitle]);

  // Generate link on first open
  if (open && !shareUrl && !isGeneratingLink) {
    handleGenerateLink();
  }

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!sigma || !graph) {
        setError("Graph not initialized");
        return;
      }

      setExporting(format);
      setError(null);

      try {
        await exportGraph(sigma, graph, {
          format,
          filename: sanitizeFilename(graphTitle),
          metadata: exportMetadata,
          includeLegend: true,
          includeHeader: true,
          includeFooter: true,
        });
      } catch (err) {
        setError(
          `Export failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        console.error(err);
      } finally {
        setExporting(null);
      }
    },
    [graphTitle, sigma, graph, exportMetadata],
  );

  // Generate preview for visual exports - matches actual export
  const generatePreview = useCallback(async () => {
    if (!sigma || !graph || !previewCanvasRef.current) return;

    const ctx = previewCanvasRef.current.getContext("2d");
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains("dark");
    const previewWidth = 400;
    const previewHeight = 260;
    const headerHeight = 32;
    const footerHeight = 20;
    const graphAreaHeight = previewHeight - headerHeight - footerHeight;

    previewCanvasRef.current.width = previewWidth;
    previewCanvasRef.current.height = previewHeight;

    // Background
    ctx.fillStyle = isDark ? "#0B0C10" : "#F6F7F8";
    ctx.fillRect(0, 0, previewWidth, previewHeight);

    // Mini header
    ctx.fillStyle = isDark ? "#111827" : "#ffffff";
    ctx.fillRect(0, 0, previewWidth, headerHeight);
    ctx.strokeStyle = isDark ? "#374151" : "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, headerHeight);
    ctx.lineTo(previewWidth, headerHeight);
    ctx.stroke();

    ctx.fillStyle = isDark ? "#f9fafb" : "#1f2937";
    ctx.font = "bold 11px system-ui";
    ctx.fillText(graphTitle, 10, 21);

    // Stats badge
    ctx.fillStyle = isDark ? "#374151" : "#f3f4f6";
    const statsText = `${nodeCount} · ${edgeCount}`;
    ctx.beginPath();
    ctx.roundRect(previewWidth - 70, 8, 60, 16, 8);
    ctx.fill();
    ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
    ctx.font = "9px system-ui";
    ctx.fillText(statsText, previewWidth - 65, 20);

    // Draw edges from graph data
    ctx.save();
    graph.forEachEdge((edge, attributes, source, target) => {
      if (attributes.hidden) return;
      const sourceAttrs = graph.getNodeAttributes(source);
      const targetAttrs = graph.getNodeAttributes(target);
      if (sourceAttrs.hidden || targetAttrs.hidden) return;

      const sv = sigma.graphToViewport({ x: sourceAttrs.x, y: sourceAttrs.y });
      const tv = sigma.graphToViewport({ x: targetAttrs.x, y: targetAttrs.y });

      // Scale to preview size
      const { width: sigmaW, height: sigmaH } = sigma.getDimensions();
      const scaleX = previewWidth / sigmaW;
      const scaleY = graphAreaHeight / sigmaH;
      const scale = Math.min(scaleX, scaleY) * 0.9;
      const offsetX = (previewWidth - sigmaW * scale) / 2;
      const offsetY = headerHeight + (graphAreaHeight - sigmaH * scale) / 2;

      const sx = sv.x * scale + offsetX;
      const sy = sv.y * scale + offsetY;
      const tx = tv.x * scale + offsetX;
      const ty = tv.y * scale + offsetY;

      const edgeType = attributes.edgeType || attributes.type || "default";
      let edgeColor = isDark ? "#6b7280" : "#9ca3af";
      if (edgeType === "supports") edgeColor = "#22c55e";
      else if (edgeType === "contradicts") edgeColor = "#ef4444";
      else if (edgeType === "extends") edgeColor = "#3b82f6";

      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;
      if (edgeType === "contradicts") ctx.setLineDash([3, 2]);
      else ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Draw nodes from graph data
    graph.forEachNode((node, attributes) => {
      if (attributes.hidden) return;
      const v = sigma.graphToViewport({ x: attributes.x, y: attributes.y });

      const { width: sigmaW, height: sigmaH } = sigma.getDimensions();
      const scaleX = previewWidth / sigmaW;
      const scaleY = graphAreaHeight / sigmaH;
      const scale = Math.min(scaleX, scaleY) * 0.9;
      const offsetX = (previewWidth - sigmaW * scale) / 2;
      const offsetY = headerHeight + (graphAreaHeight - sigmaH * scale) / 2;

      const cx = v.x * scale + offsetX;
      const cy = v.y * scale + offsetY;
      const size = Math.max((attributes.size || 5) * scale * 0.8, 2);

      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.fillStyle = attributes.color || "#999";
      ctx.fill();
    });
    ctx.restore();

    // Mini legend
    const legendX = 8;
    const legendY = headerHeight + graphAreaHeight - 50;
    ctx.fillStyle = isDark ? "rgba(17,24,39,0.9)" : "rgba(255,255,255,0.9)";
    ctx.strokeStyle = isDark ? "#374151" : "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(legendX, legendY, 65, 45, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 7px system-ui";
    ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
    ctx.fillText("LEGEND", legendX + 5, legendY + 10);

    const legendItems = [
      { color: "#22c55e", label: "Supports" },
      { color: "#ef4444", label: "Refutes" },
      { color: "#3b82f6", label: "Extends" },
    ];
    legendItems.forEach((item, i) => {
      const y = legendY + 18 + i * 9;
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(legendX + 5, y);
      ctx.lineTo(legendX + 15, y);
      ctx.stroke();
      ctx.fillStyle = isDark ? "#f9fafb" : "#1f2937";
      ctx.font = "7px system-ui";
      ctx.fillText(item.label, legendX + 18, y + 3);
    });

    // Mini footer
    ctx.fillStyle = isDark ? "#111827" : "#ffffff";
    ctx.fillRect(0, previewHeight - footerHeight, previewWidth, footerHeight);
    ctx.strokeStyle = isDark ? "#374151" : "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, previewHeight - footerHeight);
    ctx.lineTo(previewWidth, previewHeight - footerHeight);
    ctx.stroke();

    ctx.fillStyle = "#8b5cf6";
    ctx.font = "bold 8px system-ui";
    ctx.fillText("ithaca.app", previewWidth - 55, previewHeight - 6);

    ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
    ctx.font = "7px system-ui";
    ctx.fillText(
      "Exported: " + new Date().toLocaleDateString(),
      8,
      previewHeight - 6,
    );
  }, [sigma, graph, graphTitle, nodeCount, edgeCount]);

  // Generate preview when dialog opens
  useEffect(() => {
    if (open && sigma) {
      setTimeout(generatePreview, 100);
    }
  }, [open, sigma, generatePreview]);

  const handleSocialShare = useCallback(
    (platform: string) => {
      if (!shareUrl) return;

      const text = `Check out this scientific argument graph: ${graphTitle}`;
      const encodedUrl = encodeURIComponent(shareUrl);

      let shareLink = "";
      switch (platform) {
        case "twitter":
          shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodedUrl}`;
          break;
        case "email":
          shareLink = `mailto:?subject=${encodeURIComponent(`Shared Graph: ${graphTitle}`)}&body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`;
          break;
      }

      if (shareLink) {
        window.open(shareLink, "_blank", "noopener,noreferrer");
      }
    },
    [graphTitle, shareUrl],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share & Export
          </DialogTitle>
          <DialogDescription>
            Share this graph with others or export for offline use.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        <div className="space-y-6 py-4">
          {/* Export Preview */}
          {sigma && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  Export Preview
                </label>
                <Badge variant="secondary" className="text-[10px]">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Includes legend & metadata
                </Badge>
              </div>
              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-auto"
                  style={{ maxHeight: 200 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Title, stats & timestamp included</span>
                  <span>Legend embedded</span>
                </div>
              </div>
            </div>
          )}

          {/* Share Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Link</label>
            <div className="flex gap-2">
              <Input
                value={isGeneratingLink ? "Generating link..." : shareUrl || ""}
                readOnly
                className="font-mono text-xs"
                disabled={isGeneratingLink}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0"
                disabled={!shareUrl || isGeneratingLink}
              >
                {isGeneratingLink ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view this graph
            </p>
          </div>

          {/* Social Share */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share to</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleSocialShare("twitter")}
                disabled={!shareUrl}
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleSocialShare("email")}
                disabled={!shareUrl}
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Export</label>

            <div className="grid grid-cols-2 gap-2">
              {/* PNG Export */}
              <Button
                variant="outline"
                className="h-auto p-3 flex-col gap-1"
                disabled={exporting === "png" || !sigma || !graph}
                onClick={() => handleExport("png")}
              >
                {exporting === "png" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Image className="h-5 w-5" />
                )}
                <span className="text-xs font-medium">
                  {exporting === "png" ? "Exporting..." : "PNG Image"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  High-res screenshot
                </span>
              </Button>

              {/* SVG Export */}
              <Button
                variant="outline"
                className="h-auto p-3 flex-col gap-1"
                disabled={exporting === "svg" || !sigma || !graph}
                onClick={() => handleExport("svg")}
              >
                {exporting === "svg" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <FileCode className="h-5 w-5" />
                )}
                <span className="text-xs font-medium">
                  {exporting === "svg" ? "Exporting..." : "SVG Vector"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Scalable format
                </span>
              </Button>

              {/* GraphML Export */}
              <Button
                variant="outline"
                className="h-auto p-3 flex-col gap-1"
                disabled={exporting === "graphml" || !graph}
                onClick={() => handleExport("graphml")}
              >
                {exporting === "graphml" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <FileCode className="h-5 w-5" />
                )}
                <span className="text-xs font-medium">
                  {exporting === "graphml" ? "Exporting..." : "GraphML"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  For Gephi/Cytoscape
                </span>
              </Button>

              {/* JSON Export */}
              <Button
                variant="outline"
                className="h-auto p-3 flex-col gap-1"
                disabled={exporting === "json" || !graph}
                onClick={() => handleExport("json")}
              >
                {exporting === "json" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <FileJson className="h-5 w-5" />
                )}
                <span className="text-xs font-medium">
                  {exporting === "json" ? "Exporting..." : "JSON Data"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Graph structure
                </span>
              </Button>

              {/* CSV Export */}
              <Button
                variant="outline"
                className="h-auto p-3 flex-col gap-1"
                disabled={exporting === "csv" || !graph}
                onClick={() => handleExport("csv")}
              >
                {exporting === "csv" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Table className="h-5 w-5" />
                )}
                <span className="text-xs font-medium">
                  {exporting === "csv" ? "Exporting..." : "CSV Tables"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Nodes & edges sheets
                </span>
              </Button>

              {/* PDF Export */}
              <Button
                variant="outline"
                className="h-auto p-3 flex-col gap-1"
                disabled={exporting === "pdf" || !sigma || !graph}
                onClick={() => handleExport("pdf")}
              >
                {exporting === "pdf" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                <span className="text-xs font-medium">
                  {exporting === "pdf" ? "Exporting..." : "PDF Document"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Print-ready file
                </span>
              </Button>
            </div>
          </div>

          {/* Graph Info */}
          <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>{graphTitle}</span>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {nodeCount} nodes
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {edgeCount} edges
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Floating Share Button for Canvas - positioned at bottom-right
export function ShareButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg hover:bg-muted transition-colors"
    >
      <Share2 className="h-4 w-4" />
      <span className="text-sm font-medium">Share</span>
    </button>
  );
}
