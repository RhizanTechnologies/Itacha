/**
 * Graph Export Utilities
 * 
 * Export graph visualizations and data in multiple formats:
 * - PNG/SVG images for presentations
 * - GraphML for network analysis tools
 * - JSON for data interchange
 */

import Graph from "graphology";
import type { Sigma } from "sigma";
import { debug } from "./debug";

// =============================================================================
// TYPES
// =============================================================================

export type ExportFormat = "png" | "svg" | "graphml" | "json" | "csv";

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeHidden?: boolean;
  backgroundColor?: string;
  scale?: number; // For image exports (1 = actual size, 2 = 2x, etc.)
}

// =============================================================================
// IMAGE EXPORT (PNG/SVG)
// =============================================================================

/**
 * Export Sigma canvas as PNG
 */
export async function exportAsPNG(
  sigma: Sigma,
  options: Partial<ExportOptions> = {}
): Promise<string> {
  const {
    filename = "graph.png",
    backgroundColor = "#ffffff",
    scale = 2,
  } = options;

  try {
    // Get canvas from Sigma
    const canvas = sigma.getCanvases().nodes;
    if (!canvas) {
      throw new Error("Canvas not found");
    }

    // Create a new canvas with desired scale
    const width = canvas.width * scale;
    const height = canvas.height * scale;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = width;
    exportCanvas.height = height;

    const ctx = exportCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Scale context
    ctx.scale(scale, scale);

    // Draw all Sigma layers
    const layers = sigma.getCanvases();
    ["edges", "nodes", "edgeLabels", "labels", "hovers"].forEach((layer) => {
      const layerCanvas = (layers as any)[layer] as HTMLCanvasElement;
      if (layerCanvas) {
        ctx.drawImage(layerCanvas, 0, 0);
      }
    });

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      exportCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      }, "image/png");
    });

    // Create download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    debug.graph(`Exported PNG: ${filename}`);
    return url;
  } catch (error) {
    debug.error("PNG export failed:", error);
    throw error;
  }
}

/**
 * Export Sigma canvas as SVG
 */
export async function exportAsSVG(
  sigma: Sigma,
  graph: Graph,
  options: Partial<ExportOptions> = {}
): Promise<string> {
  const {
    filename = "graph.svg",
    includeHidden = false,
  } = options;

  try {
    const camera = sigma.getCamera();
    const { width, height } = sigma.getDimensions();

    // Start SVG
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="white"/>
  <g transform="translate(${width / 2}, ${height / 2}) scale(${1 / camera.ratio})">
`;

    // Draw edges first
    graph.forEachEdge((edge, attributes, source, target) => {
      if (!includeHidden && attributes.hidden) return;

      const sourceNode = graph.getNodeAttributes(source);
      const targetNode = graph.getNodeAttributes(target);

      if (!includeHidden && (sourceNode.hidden || targetNode.hidden)) return;

      svg += `    <line x1="${sourceNode.x}" y1="${sourceNode.y}" x2="${targetNode.x}" y2="${targetNode.y}" 
        stroke="${attributes.color || '#ccc'}" stroke-width="${attributes.size || 1}" opacity="0.5"/>
`;
    });

    // Draw nodes
    graph.forEachNode((node, attributes) => {
      if (!includeHidden && attributes.hidden) return;

      svg += `    <circle cx="${attributes.x}" cy="${attributes.y}" r="${attributes.size || 5}" 
        fill="${attributes.color || '#999'}"/>
`;

      // Add label
      if (attributes.label) {
        svg += `    <text x="${attributes.x}" y="${attributes.y - (attributes.size || 5) - 2}" 
          text-anchor="middle" font-size="12" fill="#333">${escapeXml(attributes.label)}</text>
`;
      }
    });

    svg += `  </g>
</svg>`;

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
  options: Partial<ExportOptions> = {}
): Promise<string> {
  const {
    filename = "graph.graphml",
    includeHidden = false,
  } = options;

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
  options: Partial<ExportOptions> = {}
): Promise<string> {
  const {
    filename = "graph.json",
    includeHidden = false,
  } = options;

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
  options: Partial<ExportOptions> = {}
): Promise<{ nodesUrl: string; edgesUrl: string }> {
  const {
    filename = "graph",
    includeHidden = false,
  } = options;

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
  options: ExportOptions
): Promise<string | { nodesUrl: string; edgesUrl: string }> {
  switch (options.format) {
    case "png":
      return exportAsPNG(sigma, options);
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
