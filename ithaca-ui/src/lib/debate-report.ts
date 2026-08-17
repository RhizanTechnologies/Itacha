import type Graph from "graphology";

export interface DebateReportClaim {
  citingId: string;
  citedId: string;
  citingTitle: string;
  citedTitle: string;
  citingYear?: number;
  citedYear?: number;
  edgeType: string;
  confidence: number;
  signalSource?: string;
  provider?: string;
  evidence: string[];
  corrected: boolean;
}

export interface DebateReport {
  title: string;
  query?: string;
  generatedAt: string;
  contestedClaims: DebateReportClaim[];
  corrections: DebateReportClaim[];
  uncertainClaims: DebateReportClaim[];
}

function nodeLabel(graph: Graph, id: string): { title: string; year?: number } {
  if (!graph.hasNode(id)) return { title: id };
  const attrs = graph.getNodeAttributes(id);
  return {
    title: String(attrs.title || attrs.label || id),
    year: typeof attrs.year === "number" ? attrs.year : undefined,
  };
}

function evidenceFromAttrs(attrs: Record<string, unknown>): string[] {
  const evidence: string[] = [];
  const contexts = attrs.contexts;
  if (Array.isArray(contexts)) {
    for (const ctx of contexts) {
      if (typeof ctx === "string" && ctx.trim()) evidence.push(ctx.trim());
    }
  }
  if (typeof attrs.snippet === "string" && attrs.snippet.trim()) {
    evidence.push(attrs.snippet.trim());
  }
  return evidence.slice(0, 5);
}

function isContested(attrs: Record<string, unknown>): boolean {
  const type = String(attrs.edgeType || "");
  const provider = String(attrs.provider || "");
  const signal = String(attrs.signalSource || "");
  const confidence = Number(attrs.confidence ?? 0);
  const normalizedConfidence = confidence > 1 ? confidence / 100 : confidence;

  return (
    type === "contradicts" ||
    provider === "user-correction" ||
    signal === "user-correction" ||
    (normalizedConfidence > 0 && normalizedConfidence < 0.5)
  );
}

export function buildDebateReport(
  graph: Graph,
  options: { title?: string; query?: string } = {},
): DebateReport {
  const contestedClaims: DebateReportClaim[] = [];
  const corrections: DebateReportClaim[] = [];
  const uncertainClaims: DebateReportClaim[] = [];

  graph.forEachEdge((edge, attrs, source, target) => {
    if (attrs.hidden) return;
    if (!isContested(attrs as Record<string, unknown>)) return;

    const citing = nodeLabel(graph, source);
    const cited = nodeLabel(graph, target);
    const confidenceRaw = Number(attrs.confidence ?? 0);
    const confidence =
      confidenceRaw > 1
        ? Math.round(confidenceRaw)
        : Math.round(confidenceRaw * 100);
    const provider = String(attrs.provider || "");
    const signal = String(attrs.signalSource || "");
    const corrected =
      provider === "user-correction" || signal === "user-correction";

    const claim: DebateReportClaim = {
      citingId: source,
      citedId: target,
      citingTitle: citing.title,
      citedTitle: cited.title,
      citingYear: citing.year,
      citedYear: cited.year,
      edgeType: String(attrs.edgeType || "unknown"),
      confidence,
      signalSource: signal || undefined,
      provider: provider || undefined,
      evidence: evidenceFromAttrs(attrs as Record<string, unknown>),
      corrected,
    };

    contestedClaims.push(claim);
    if (corrected) corrections.push(claim);
    if (!corrected && confidence < 50) uncertainClaims.push(claim);
  });

  contestedClaims.sort((a, b) => {
    if (a.edgeType === "contradicts" && b.edgeType !== "contradicts") return -1;
    if (b.edgeType === "contradicts" && a.edgeType !== "contradicts") return 1;
    return a.confidence - b.confidence;
  });

  return {
    title: options.title || "Debate Report",
    query: options.query,
    generatedAt: new Date().toISOString(),
    contestedClaims,
    corrections,
    uncertainClaims,
  };
}

function formatClaim(claim: DebateReportClaim, index: number): string {
  const citingYear = claim.citingYear ? ` (${claim.citingYear})` : "";
  const citedYear = claim.citedYear ? ` (${claim.citedYear})` : "";
  const lines = [
    `### ${index}. ${claim.edgeType} — ${claim.confidence}% confidence`,
    "",
    `- **From:** ${claim.citingTitle}${citingYear}`,
    `- **To:** ${claim.citedTitle}${citedYear}`,
    claim.corrected ? "- **Status:** Human corrected" : undefined,
    claim.signalSource ? `- **Signal:** ${claim.signalSource}` : undefined,
    "",
  ].filter(Boolean) as string[];

  if (claim.evidence.length > 0) {
    lines.push("**Evidence**", "");
    for (const snippet of claim.evidence) {
      lines.push(`> ${snippet}`, "");
    }
  } else {
    lines.push("_No citation sentence available._", "");
  }

  return lines.join("\n");
}

export function renderDebateReportMarkdown(report: DebateReport): string {
  const sections = [
    `# ${report.title}`,
    "",
    `Generated ${report.generatedAt}`,
    report.query ? `Query: ${report.query}` : undefined,
    "",
    "## Summary",
    "",
    `- Contested claims: ${report.contestedClaims.length}`,
    `- Human corrections: ${report.corrections.length}`,
    `- Uncertain (low confidence): ${report.uncertainClaims.length}`,
    "",
    "## Contested claims",
    "",
  ].filter((line) => line !== undefined);

  if (report.contestedClaims.length === 0) {
    sections.push("_No contested or uncertain claims in this graph._", "");
  } else {
    report.contestedClaims.forEach((claim, index) => {
      sections.push(formatClaim(claim, index + 1));
    });
  }

  sections.push("## Corrections", "");
  if (report.corrections.length === 0) {
    sections.push("_No human corrections recorded on this map._", "");
  } else {
    report.corrections.forEach((claim, index) => {
      sections.push(formatClaim(claim, index + 1));
    });
  }

  sections.push(
    "---",
    "",
    "_Exported from Ithaca — argumentation-aware citation map._",
    "",
  );

  return sections.join("\n");
}
