/**
 * Graph Export Utilities
 *
 * Export graph visualizations and data in multiple formats:
 * - PNG/SVG images for presentations (with legend, title, metadata)
 * - GraphML for network analysis tools
 * - JSON for data interchange
 *
 * All visual exports pass the "cold open test" - shareable with context
 */

import Graph from "graphology";
import type { Sigma } from "sigma";
import { debug } from "./debug";

// =============================================================================
// TYPES
// =============================================================================

export type ExportFormat = "png" | "svg" | "graphml" | "json" | "csv";

export interface ExportMetadata {
  title: string;
  description?: string;
  nodeCount: number;
  edgeCount: number;
  timestamp?: string;
  query?: string;
}

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeHidden?: boolean;
  backgroundColor?: string;
  scale?: number; // For image exports (1 = actual size, 2 = 2x, etc.)
  metadata?: ExportMetadata;
  includeLegend?: boolean;
  includeHeader?: boolean;
  includeFooter?: boolean;
  quality?: "compressed" | "standard" | "print"; // affects DPI/size
}

// =============================================================================
// LEGEND CONFIGURATION
// =============================================================================

const LEGEND_CONFIG = {
  edgeTypes: [
    { color: "#22c55e", label: "Supports", dashed: false },
    { color: "#ef4444", label: "Refutes", dashed: true },
    { color: "#3b82f6", label: "Extends", dashed: false },
  ],
  nodeInfo: { label: "Citation Node" },
};

// =============================================================================
// BRANDING & STYLING
// =============================================================================

const BRAND = {
  name: "Ithaca",
  watermark: "ithaca.app",
  colors: {
    primary: "#8b5cf6",
    background: { light: "#F6F7F8", dark: "#0B0C10" },
    text: { light: "#1f2937", dark: "#f9fafb" },
    muted: { light: "#6b7280", dark: "#9ca3af" },
  },
};

// =============================================================================
// IMAGE EXPORT (PNG/SVG)
// =============================================================================

/**
 * Get scale factor based on quality setting
 */
function getScaleForQuality(quality: ExportOptions["quality"]): number {
  switch (quality) {
    case "compressed":
      return 1;
    case "print":
      return 3;
    default:
      return 2;
  }
}

/**
 * Draw the header section with title and context
 */
function drawHeader(
  ctx: CanvasRenderingContext2D,
  metadata: ExportMetadata,
  width: number,
  isDark: boolean,
  scale: number,
): number {
  const padding = 24 * scale;
  const headerHeight = 80 * scale;

  // Header background
  ctx.fillStyle = isDark ? "#111827" : "#ffffff";
  ctx.fillRect(0, 0, width, headerHeight);

  // Bottom border
  ctx.strokeStyle = isDark ? "#374151" : "#e5e7eb";
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(0, headerHeight);
  ctx.lineTo(width, headerHeight);
  ctx.stroke();

  // Title
  ctx.fillStyle = isDark ? BRAND.colors.text.dark : BRAND.colors.text.light;
  ctx.font = `bold ${18 * scale}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(metadata.title, padding, 36 * scale);

  // Description/context
  if (metadata.description || metadata.query) {
    ctx.fillStyle = isDark ? BRAND.colors.muted.dark : BRAND.colors.muted.light;
    ctx.font = `${12 * scale}px system-ui, -apple-system, sans-serif`;
    const contextText = metadata.query
      ? `Query: "${metadata.query}"`
      : metadata.description || "";
    ctx.fillText(contextText, padding, 58 * scale);
  }

  // Stats badge on the right
  ctx.fillStyle = isDark ? "#374151" : "#f3f4f6";
  const statsText = `${metadata.nodeCount} papers · ${metadata.edgeCount} citations`;
  ctx.font = `${11 * scale}px system-ui, -apple-system, sans-serif`;
  const statsWidth = ctx.measureText(statsText).width + 16 * scale;
  const statsX = width - padding - statsWidth;

  // Stats background pill
  ctx.beginPath();
  ctx.roundRect(statsX, 26 * scale, statsWidth, 24 * scale, 12 * scale);
  ctx.fill();

  // Stats text
  ctx.fillStyle = isDark ? BRAND.colors.muted.dark : BRAND.colors.muted.light;
  ctx.fillText(statsText, statsX + 8 * scale, 43 * scale);

  return headerHeight;
}

/**
 * Draw the legend section
 */
function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isDark: boolean,
  scale: number,
): { width: number; height: number } {
  const padding = 12 * scale;
  const itemHeight = 20 * scale;
  const legendWidth = 140 * scale;
  const legendHeight =
    (LEGEND_CONFIG.edgeTypes.length + 2) * itemHeight + padding * 2;

  // Legend background
  ctx.fillStyle = isDark
    ? "rgba(17, 24, 39, 0.95)"
    : "rgba(255, 255, 255, 0.95)";
  ctx.strokeStyle = isDark ? "#374151" : "#e5e7eb";
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.roundRect(x, y, legendWidth, legendHeight, 8 * scale);
  ctx.fill();
  ctx.stroke();

  // Legend title
  ctx.fillStyle = isDark ? BRAND.colors.muted.dark : BRAND.colors.muted.light;
  ctx.font = `bold ${9 * scale}px system-ui, -apple-system, sans-serif`;
  ctx.fillText("LEGEND", x + padding, y + padding + 10 * scale);

  // Edge types
  let currentY = y + padding + 28 * scale;
  ctx.font = `${11 * scale}px system-ui, -apple-system, sans-serif`;

  LEGEND_CONFIG.edgeTypes.forEach((edge) => {
    // Line
    ctx.strokeStyle = edge.color;
    ctx.lineWidth = 2 * scale;
    if (edge.dashed) {
      ctx.setLineDash([4 * scale, 2 * scale]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.moveTo(x + padding, currentY);
    ctx.lineTo(x + padding + 20 * scale, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = isDark ? BRAND.colors.text.dark : BRAND.colors.text.light;
    ctx.fillText(edge.label, x + padding + 28 * scale, currentY + 4 * scale);

    currentY += itemHeight;
  });

  // Node indicator
  ctx.strokeStyle = isDark ? "#6b7280" : "#9ca3af";
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.arc(x + padding + 10 * scale, currentY, 6 * scale, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = isDark ? BRAND.colors.text.dark : BRAND.colors.text.light;
  ctx.fillText(
    LEGEND_CONFIG.nodeInfo.label,
    x + padding + 28 * scale,
    currentY + 4 * scale,
  );

  return { width: legendWidth, height: legendHeight };
}

/**
 * Draw the footer section with timestamp and watermark
 */
function drawFooter(
  ctx: CanvasRenderingContext2D,
  metadata: ExportMetadata,
  width: number,
  canvasHeight: number,
  isDark: boolean,
  scale: number,
): number {
  const footerHeight = 40 * scale;
  const padding = 24 * scale;
  const footerY = canvasHeight - footerHeight;

  // Footer background
  ctx.fillStyle = isDark ? "#111827" : "#ffffff";
  ctx.fillRect(0, footerY, width, footerHeight);

  // Top border
  ctx.strokeStyle = isDark ? "#374151" : "#e5e7eb";
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(width, footerY);
  ctx.stroke();

  // Timestamp on left
  ctx.fillStyle = isDark ? BRAND.colors.muted.dark : BRAND.colors.muted.light;
  ctx.font = `${10 * scale}px system-ui, -apple-system, sans-serif`;
  const timestamp = metadata.timestamp || new Date().toISOString();
  const formattedDate = new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  ctx.fillText(`Exported: ${formattedDate}`, padding, footerY + 25 * scale);

  // Watermark on right
  ctx.fillStyle = BRAND.colors.primary;
  ctx.font = `bold ${11 * scale}px system-ui, -apple-system, sans-serif`;
  const watermarkText = BRAND.watermark;
  const watermarkWidth = ctx.measureText(watermarkText).width;
  ctx.fillText(
    watermarkText,
    width - padding - watermarkWidth,
    footerY + 25 * scale,
  );

  return footerHeight;
}

/**
 * Export Sigma canvas as PNG with full context (header, legend, footer)
 * Draws edges directly from graph data for reliability
 */
export async function exportAsPNG(
  sigma: Sigma,
  options: Partial<ExportOptions> = {},
  graph?: Graph,
): Promise<string> {
  const {
    filename = "graph.png",
    quality = "standard",
    metadata = { title: "Citation Network", nodeCount: 0, edgeCount: 0 },
    includeLegend = true,
    includeHeader = true,
    includeFooter = true,
    includeHidden = false,
  } = options;

  const scale = getScaleForQuality(quality);
  const isDark = document.documentElement.classList.contains("dark");
  const bgColor = isDark
    ? BRAND.colors.background.dark
    : BRAND.colors.background.light;

  try {
    // Get canvas dimensions from Sigma
    const { width: sigmaWidth, height: sigmaHeight } = sigma.getDimensions();
    const graphWidth = sigmaWidth;
    const graphHeight = sigmaHeight;
    const headerHeight = includeHeader ? 80 * scale : 0;
    const footerHeight = includeFooter ? 40 * scale : 0;

    const exportWidth = graphWidth * scale;
    const exportHeight = graphHeight * scale + headerHeight + footerHeight;

    // Create export canvas
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;

    const ctx = exportCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    // Draw header
    if (includeHeader) {
      drawHeader(ctx, metadata, exportWidth, isDark, scale);
    }

    // Draw graph content
    ctx.save();
    ctx.translate(0, headerHeight);
    ctx.scale(scale, scale);

    // Get the graph from sigma if not provided
    const graphData = graph || sigma.getGraph();

    if (graphData) {
      // Draw edges manually from graph data
      const camera = sigma.getCamera();
      const viewportWidth = graphWidth;
      const viewportHeight = graphHeight;

      graphData.forEachEdge((edge, attributes, source, target) => {
        if (!includeHidden && attributes.hidden) return;

        const sourceAttrs = graphData.getNodeAttributes(source);
        const targetAttrs = graphData.getNodeAttributes(target);

        if (!includeHidden && (sourceAttrs.hidden || targetAttrs.hidden))
          return;

        // Convert graph coordinates to viewport coordinates
        const sourceViewport = sigma.graphToViewport({
          x: sourceAttrs.x,
          y: sourceAttrs.y,
        });
        const targetViewport = sigma.graphToViewport({
          x: targetAttrs.x,
          y: targetAttrs.y,
        });

        // Get edge color and type
        const edgeType = attributes.edgeType || attributes.type || "default";
        let edgeColor = attributes.color || "#999999";

        // Ensure edge colors are visible in both themes
        if (edgeType === "supports") {
          edgeColor = "#22c55e"; // green
        } else if (edgeType === "contradicts") {
          edgeColor = "#ef4444"; // red
        } else if (edgeType === "extends") {
          edgeColor = "#3b82f6"; // blue
        } else {
          // Default edge color - make it visible in both themes
          edgeColor = isDark ? "#6b7280" : "#9ca3af";
        }

        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = (attributes.size || 1) * 1.5;
        ctx.globalAlpha = 0.7;

        // Dashed line for contradicts/refutes
        if (edgeType === "contradicts") {
          ctx.setLineDash([6, 3]);
        } else {
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(sourceViewport.x, sourceViewport.y);
        ctx.lineTo(targetViewport.x, targetViewport.y);
        ctx.stroke();
      });

      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Draw nodes manually from graph data
      graphData.forEachNode((node, attributes) => {
        if (!includeHidden && attributes.hidden) return;

        const viewport = sigma.graphToViewport({
          x: attributes.x,
          y: attributes.y,
        });
        const size = attributes.size || 5;
        const isHighlighted =
          attributes.highlighted || attributes.controversyScore > 0;

        // Draw node circle
        ctx.beginPath();
        ctx.arc(viewport.x, viewport.y, size, 0, Math.PI * 2);
        ctx.fillStyle = attributes.color || "#999999";
        ctx.fill();

        // Draw label with theme-aware background for highlighted nodes
        if (attributes.label) {
          const label = attributes.label;
          ctx.font = `11px system-ui, -apple-system, sans-serif`;
          const textWidth = ctx.measureText(label).width;
          const labelX = viewport.x;
          const labelY = viewport.y - size - 8;

          if (isHighlighted) {
            // Draw pill background - THEME AWARE
            const pillPadding = 6;
            const pillHeight = 18;
            const pillBgColor = isDark ? "#1f2937" : "#ffffff";
            const pillBorderColor = isDark ? "#374151" : "#e5e7eb";

            ctx.fillStyle = pillBgColor;
            ctx.strokeStyle = pillBorderColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(
              labelX - textWidth / 2 - pillPadding,
              labelY - pillHeight / 2 - 2,
              textWidth + pillPadding * 2,
              pillHeight,
              pillHeight / 2,
            );
            ctx.fill();
            ctx.stroke();
          }

          // Draw label text - THEME AWARE
          ctx.fillStyle = isDark ? "#f9fafb" : "#1f2937";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, labelX, labelY);
        }
      });
    } else {
      // Fallback: try to capture canvas layers
      const layers = sigma.getCanvases();
      ["edges", "nodes", "edgeLabels", "labels", "hovers"].forEach((layer) => {
        const layerCanvas = (layers as any)[layer] as HTMLCanvasElement;
        if (layerCanvas) {
          ctx.drawImage(layerCanvas, 0, 0);
        }
      });
    }

    ctx.restore();

    // Draw legend (positioned inside graph area, bottom-left)
    if (includeLegend) {
      const legendX = 16 * scale;
      const legendY = headerHeight + graphHeight * scale - 180 * scale;
      drawLegend(ctx, legendX, legendY, isDark, scale);
    }

    // Draw footer
    if (includeFooter) {
      drawFooter(ctx, metadata, exportWidth, exportHeight, isDark, scale);
    }

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      exportCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/png",
        quality === "print" ? 1.0 : 0.92,
      );
    });

    // Create download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    debug.graph(
      `Exported PNG: ${filename} (${quality} quality, ${Math.round(blob.size / 1024)}KB)`,
    );
    return url;
  } catch (error) {
    debug.error("PNG export failed:", error);
    throw error;
  }
}

/**
 * Generate SVG legend markup
 */
function generateSVGLegend(x: number, y: number, isDark: boolean): string {
  const bgColor = isDark
    ? "rgba(17, 24, 39, 0.95)"
    : "rgba(255, 255, 255, 0.95)";
  const borderColor = isDark ? "#374151" : "#e5e7eb";
  const textColor = isDark ? "#f9fafb" : "#1f2937";
  const mutedColor = isDark ? "#9ca3af" : "#6b7280";

  let legend = `
  <g transform="translate(${x}, ${y})">
    <rect width="140" height="120" rx="8" fill="${bgColor}" stroke="${borderColor}" stroke-width="1"/>
    <text x="12" y="20" font-size="9" font-weight="bold" fill="${mutedColor}" font-family="system-ui, sans-serif">LEGEND</text>
`;

  let itemY = 40;
  LEGEND_CONFIG.edgeTypes.forEach((edge) => {
    const dashArray = edge.dashed ? 'stroke-dasharray="4 2"' : "";
    legend += `    <line x1="12" y1="${itemY}" x2="32" y2="${itemY}" stroke="${edge.color}" stroke-width="2" ${dashArray}/>
    <text x="40" y="${itemY + 4}" font-size="11" fill="${textColor}" font-family="system-ui, sans-serif">${edge.label}</text>
`;
    itemY += 20;
  });

  // Node indicator
  legend += `    <circle cx="22" cy="${itemY}" r="6" fill="none" stroke="${mutedColor}" stroke-width="2"/>
    <text x="40" y="${itemY + 4}" font-size="11" fill="${textColor}" font-family="system-ui, sans-serif">${LEGEND_CONFIG.nodeInfo.label}</text>
  </g>
`;
  return legend;
}

/**
 * Generate SVG header markup
 */
function generateSVGHeader(
  width: number,
  metadata: ExportMetadata,
  isDark: boolean,
): string {
  const bgColor = isDark ? "#111827" : "#ffffff";
  const borderColor = isDark ? "#374151" : "#e5e7eb";
  const textColor = isDark ? "#f9fafb" : "#1f2937";
  const mutedColor = isDark ? "#9ca3af" : "#6b7280";
  const pillBg = isDark ? "#374151" : "#f3f4f6";

  const statsText = `${metadata.nodeCount} papers · ${metadata.edgeCount} citations`;
  const contextText = metadata.query
    ? `Query: "${metadata.query}"`
    : metadata.description || "";

  return `
  <g id="header">
    <rect width="${width}" height="80" fill="${bgColor}"/>
    <line x1="0" y1="80" x2="${width}" y2="80" stroke="${borderColor}" stroke-width="1"/>
    <text x="24" y="36" font-size="18" font-weight="bold" fill="${textColor}" font-family="system-ui, sans-serif">${escapeXml(metadata.title)}</text>
    ${contextText ? `<text x="24" y="58" font-size="12" fill="${mutedColor}" font-family="system-ui, sans-serif">${escapeXml(contextText)}</text>` : ""}
    <rect x="${width - 180}" y="26" width="156" height="24" rx="12" fill="${pillBg}"/>
    <text x="${width - 172}" y="43" font-size="11" fill="${mutedColor}" font-family="system-ui, sans-serif">${statsText}</text>
  </g>
`;
}

/**
 * Generate SVG footer markup
 */
function generateSVGFooter(
  width: number,
  totalHeight: number,
  metadata: ExportMetadata,
  isDark: boolean,
): string {
  const bgColor = isDark ? "#111827" : "#ffffff";
  const borderColor = isDark ? "#374151" : "#e5e7eb";
  const mutedColor = isDark ? "#9ca3af" : "#6b7280";
  const footerY = totalHeight - 40;

  const timestamp = metadata.timestamp || new Date().toISOString();
  const formattedDate = new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return `
  <g id="footer" transform="translate(0, ${footerY})">
    <rect width="${width}" height="40" fill="${bgColor}"/>
    <line x1="0" y1="0" x2="${width}" y2="0" stroke="${borderColor}" stroke-width="1"/>
    <text x="24" y="25" font-size="10" fill="${mutedColor}" font-family="system-ui, sans-serif">Exported: ${formattedDate}</text>
    <text x="${width - 80}" y="25" font-size="11" font-weight="bold" fill="${BRAND.colors.primary}" font-family="system-ui, sans-serif">${BRAND.watermark}</text>
  </g>
`;
}

/**
 * Export Sigma canvas as SVG with full context (header, legend, footer)
 * Text is selectable and searchable
 */
export async function exportAsSVG(
  sigma: Sigma,
  graph: Graph,
  options: Partial<ExportOptions> = {},
): Promise<string> {
  const {
    filename = "graph.svg",
    includeHidden = false,
    metadata = { title: "Citation Network", nodeCount: 0, edgeCount: 0 },
    includeLegend = true,
    includeHeader = true,
    includeFooter = true,
  } = options;

  const isDark = document.documentElement.classList.contains("dark");

  try {
    const camera = sigma.getCamera();
    const { width, height } = sigma.getDimensions();

    const headerHeight = includeHeader ? 80 : 0;
    const footerHeight = includeFooter ? 40 : 0;
    const totalHeight = height + headerHeight + footerHeight;

    const bgColor = isDark
      ? BRAND.colors.background.dark
      : BRAND.colors.background.light;
    const textColor = isDark ? "#f9fafb" : "#1f2937";

    // Start SVG with metadata
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
  <title>${escapeXml(metadata.title)}</title>
  <desc>Citation network visualization with ${metadata.nodeCount} papers and ${metadata.edgeCount} citations. Exported from ${BRAND.watermark}</desc>
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <rdf:Description>
        <dc:title>${escapeXml(metadata.title)}</dc:title>
        <dc:creator>${BRAND.name}</dc:creator>
        <dc:date>${metadata.timestamp || new Date().toISOString()}</dc:date>
      </rdf:Description>
    </rdf:RDF>
  </metadata>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="${bgColor}"/>
`;

    // Add header
    if (includeHeader) {
      svg += generateSVGHeader(width, metadata, isDark);
    }

    // Graph content
    svg += `
  <!-- Graph Content -->
  <g id="graph">
`;

    // Draw edges first - using viewport coordinates
    graph.forEachEdge((edge, attributes, source, target) => {
      if (!includeHidden && attributes.hidden) return;

      const sourceNode = graph.getNodeAttributes(source);
      const targetNode = graph.getNodeAttributes(target);

      if (!includeHidden && (sourceNode.hidden || targetNode.hidden)) return;

      // Convert to viewport coordinates
      const sourceViewport = sigma.graphToViewport({
        x: sourceNode.x,
        y: sourceNode.y,
      });
      const targetViewport = sigma.graphToViewport({
        x: targetNode.x,
        y: targetNode.y,
      });

      // Offset for header
      const sx = sourceViewport.x;
      const sy = sourceViewport.y + headerHeight;
      const tx = targetViewport.x;
      const ty = targetViewport.y + headerHeight;

      const edgeType = attributes.edgeType || attributes.type || "default";

      // Determine edge color based on type
      let edgeColor: string;
      if (edgeType === "supports") {
        edgeColor = "#22c55e"; // green
      } else if (edgeType === "contradicts") {
        edgeColor = "#ef4444"; // red
      } else if (edgeType === "extends") {
        edgeColor = "#3b82f6"; // blue
      } else {
        // Default edge color - theme aware
        edgeColor = isDark ? "#6b7280" : "#9ca3af";
      }

      const dashArray =
        edgeType === "contradicts" ? 'stroke-dasharray="6 3"' : "";
      const strokeWidth = (attributes.size || 1) * 1.5;

      svg += `    <line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" 
        stroke="${edgeColor}" stroke-width="${strokeWidth}" opacity="0.7" ${dashArray}/>
`;
    });

    // Draw nodes - using viewport coordinates
    graph.forEachNode((node, attributes) => {
      if (!includeHidden && attributes.hidden) return;

      const viewport = sigma.graphToViewport({
        x: attributes.x,
        y: attributes.y,
      });
      const cx = viewport.x;
      const cy = viewport.y + headerHeight;
      const size = attributes.size || 5;
      const isHighlighted =
        attributes.highlighted || attributes.controversyScore > 0;

      svg += `    <circle cx="${cx}" cy="${cy}" r="${size}" 
        fill="${attributes.color || "#999"}" data-id="${escapeXml(node)}"/>
`;

      // Add label (selectable text) with theme-aware background for highlighted nodes
      if (attributes.label) {
        const labelY = cy - size - 8;

        if (isHighlighted) {
          // Draw pill background - THEME AWARE
          const pillBgColor = isDark ? "#1f2937" : "#ffffff";
          const pillBorderColor = isDark ? "#374151" : "#e5e7eb";
          const textWidth = attributes.label.length * 6.5; // approximate
          const pillPadding = 6;
          const pillHeight = 18;

          svg += `    <rect x="${cx - textWidth / 2 - pillPadding}" y="${labelY - pillHeight / 2 - 2}" 
            width="${textWidth + pillPadding * 2}" height="${pillHeight}" rx="${pillHeight / 2}"
            fill="${pillBgColor}" stroke="${pillBorderColor}" stroke-width="1"/>
`;
        }

        svg += `    <text x="${cx}" y="${labelY}" 
          text-anchor="middle" font-size="11" fill="${textColor}" font-family="system-ui, sans-serif" 
          style="pointer-events: all; cursor: default;">${escapeXml(attributes.label)}</text>
`;
      }
    });

    svg += `  </g>
`;

    // Add legend
    if (includeLegend) {
      svg += generateSVGLegend(16, headerHeight + height - 140, isDark);
    }

    // Add footer
    if (includeFooter) {
      svg += generateSVGFooter(width, totalHeight, metadata, isDark);
    }

    svg += `</svg>`;

    // Create download
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    debug.graph(`Exported SVG: ${filename}`);
    return url;
  } catch (error) {
    debug.error("SVG export failed:", error);
    throw error;
  }
}

// =============================================================================
// DATA EXPORT (GraphML, JSON, CSV)
// =============================================================================

/**
 * Export graph as GraphML (for Gephi, Cytoscape, etc.)
 */
export async function exportAsGraphML(
  graph: Graph,
  options: Partial<ExportOptions> = {},
): Promise<string> {
  const { filename = "graph.graphml", includeHidden = false } = options;

  try {
    let graphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="x" for="node" attr.name="x" attr.type="double"/>
  <key id="y" for="node" attr.name="y" attr.type="double"/>
  <key id="size" for="node" attr.name="size" attr.type="double"/>
  <key id="color" for="node" attr.name="color" attr.type="string"/>
  <key id="title" for="node" attr.name="title" attr.type="string"/>
  <key id="year" for="node" attr.name="year" attr.type="int"/>
  <key id="citations" for="node" attr.name="citations" attr.type="int"/>
  <key id="weight" for="edge" attr.name="weight" attr.type="double"/>
  <key id="type" for="edge" attr.name="type" attr.type="string"/>
  <graph edgedefault="directed">
`;

    // Add nodes
    graph.forEachNode((node, attributes) => {
      if (!includeHidden && attributes.hidden) return;

      graphml += `    <node id="${escapeXml(node)}">
      <data key="label">${escapeXml(attributes.label || node)}</data>
      <data key="x">${attributes.x || 0}</data>
      <data key="y">${attributes.y || 0}</data>
      <data key="size">${attributes.size || 5}</data>
      <data key="color">${attributes.color || "#999"}</data>
`;

      if (attributes.title) {
        graphml += `      <data key="title">${escapeXml(attributes.title)}</data>
`;
      }
      if (attributes.year) {
        graphml += `      <data key="year">${attributes.year}</data>
`;
      }
      if (attributes.citations) {
        graphml += `      <data key="citations">${attributes.citations}</data>
`;
      }

      graphml += `    </node>
`;
    });

    // Add edges
    graph.forEachEdge((edge, attributes, source, target) => {
      if (!includeHidden && attributes.hidden) return;

      graphml += `    <edge source="${escapeXml(source)}" target="${escapeXml(target)}">
      <data key="weight">${attributes.weight || 1}</data>
      <data key="type">${attributes.type || "default"}</data>
    </edge>
`;
    });

    graphml += `  </graph>
</graphml>`;

    // Create download
    const blob = new Blob([graphml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    debug.graph(`Exported GraphML: ${filename}`);
    return url;
  } catch (error) {
    debug.error("GraphML export failed:", error);
    throw error;
  }
}

/**
 * Export graph as JSON
 */
export async function exportAsJSON(
  graph: Graph,
  options: Partial<ExportOptions> = {},
): Promise<string> {
  const { filename = "graph.json", includeHidden = false } = options;

  try {
    const nodes: any[] = [];
    const edges: any[] = [];

    graph.forEachNode((node, attributes) => {
      if (!includeHidden && attributes.hidden) return;
      nodes.push({ id: node, ...attributes });
    });

    graph.forEachEdge((edge, attributes, source, target) => {
      if (!includeHidden && attributes.hidden) return;
      edges.push({ id: edge, source, target, ...attributes });
    });

    const data = { nodes, edges };
    const json = JSON.stringify(data, null, 2);

    // Create download
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    debug.graph(`Exported JSON: ${filename}`);
    return url;
  } catch (error) {
    debug.error("JSON export failed:", error);
    throw error;
  }
}

/**
 * Export graph as CSV (nodes and edges separately)
 */
export async function exportAsCSV(
  graph: Graph,
  options: Partial<ExportOptions> = {},
): Promise<{ nodesUrl: string; edgesUrl: string }> {
  const { filename = "graph", includeHidden = false } = options;

  try {
    // Nodes CSV
    let nodesCsv = "id,label,x,y,size,color,title,year,citations\n";
    graph.forEachNode((node, attributes) => {
      if (!includeHidden && attributes.hidden) return;

      nodesCsv += `"${node}","${csvEscape(attributes.label || node)}",${attributes.x || 0},${attributes.y || 0},${attributes.size || 5},"${attributes.color || "#999"}","${csvEscape(attributes.title || "")}",${attributes.year || ""},${attributes.citations || ""}\n`;
    });

    // Edges CSV
    let edgesCsv = "source,target,type,weight,color\n";
    graph.forEachEdge((edge, attributes, source, target) => {
      if (!includeHidden && attributes.hidden) return;

      edgesCsv += `"${source}","${target}","${attributes.type || "default"}",${attributes.weight || 1},"${attributes.color || "#ccc"}"\n`;
    });

    // Download nodes
    const nodesBlob = new Blob([nodesCsv], { type: "text/csv" });
    const nodesUrl = URL.createObjectURL(nodesBlob);
    const nodesLink = document.createElement("a");
    nodesLink.href = nodesUrl;
    nodesLink.download = `${filename}_nodes.csv`;
    nodesLink.click();

    // Download edges
    const edgesBlob = new Blob([edgesCsv], { type: "text/csv" });
    const edgesUrl = URL.createObjectURL(edgesBlob);
    const edgesLink = document.createElement("a");
    edgesLink.href = edgesUrl;
    edgesLink.download = `${filename}_edges.csv`;
    edgesLink.click();

    debug.graph(`Exported CSV: ${filename}_nodes.csv, ${filename}_edges.csv`);
    return { nodesUrl, edgesUrl };
  } catch (error) {
    debug.error("CSV export failed:", error);
    throw error;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function csvEscape(str: string): string {
  return str.replace(/"/g, '""');
}

/**
 * Main export function - routes to appropriate exporter
 */
export async function exportGraph(
  sigma: Sigma,
  graph: Graph,
  options: ExportOptions,
): Promise<string | { nodesUrl: string; edgesUrl: string }> {
  switch (options.format) {
    case "png":
      return exportAsPNG(sigma, options, graph);
    case "svg":
      return exportAsSVG(sigma, graph, options);
    case "graphml":
      return exportAsGraphML(graph, options);
    case "json":
      return exportAsJSON(graph, options);
    case "csv":
      return exportAsCSV(graph, options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}
