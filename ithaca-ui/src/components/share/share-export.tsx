"use client";

import { useState, useCallback, useRef } from "react";
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
} from "lucide-react";

interface ShareExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  graphTitle?: string;
  nodeCount?: number;
  edgeCount?: number;
  // For actual PNG export, pass the function
  onExportPNG?: () => Promise<void>;
  sigmaRef?: React.RefObject<any>;
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
  graphTitle = "Argument Graph",
  nodeCount = 100,
  edgeCount = 250,
  onExportPNG,
}: ShareExportProps) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    async (format: "png" | "json") => {
      setExporting(format);
      setError(null);

      try {
        if (format === "png") {
          if (onExportPNG) {
            await onExportPNG();
          } else {
            await exportAsPNG(graphTitle);
          }
        } else {
          await exportAsJSON(graphTitle, nodeCount, edgeCount);
        }
      } catch (err) {
        setError(
          `Export failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        console.error(err);
      } finally {
        setExporting(null);
      }
    },
    [graphTitle, nodeCount, edgeCount],
  );

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
      <DialogContent className="sm:max-w-md">
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
              <Button
                variant="outline"
                className="h-auto p-3 flex-col gap-1"
                disabled={exporting === "png"}
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
                  Canvas screenshot
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-3 flex-col gap-1"
                disabled={exporting === "json"}
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
      className="absolute bottom-6 right-4 z-30 flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg hover:bg-muted transition-colors"
    >
      <Share2 className="h-4 w-4" />
      <span className="text-sm font-medium">Share</span>
    </button>
  );
}
