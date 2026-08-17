"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import {
  ContainedPanel,
  ContainedPanelHeader,
  ContainedPanelTitle,
  ContainedPanelContent,
} from "@/components/ui/contained-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Network,
  Quote,
  BookOpen,
  ExternalLink,
  Download,
  CheckCircle,
  XCircle,
  ArrowRightCircle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Upload,
  Copy,
  Check,
  LinkIcon,
} from "lucide-react";

// Paper data interface
export interface PaperData {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue?: string;
  arxivId?: string;
  doi?: string;
  openAccessUrl?: string;
  citations: number;
  references?: number;
  supports: number;
  refutes: number;
  abstract?: string;
  aiSummary?: string;
  status?: "solid" | "ghost";
}

// Evidence item interface
export interface EvidenceItem {
  id: string;
  sourcePaper: {
    title: string;
    authors: string;
    year: number;
  };
  relation: "supports" | "refutes" | "extends" | "cites" | "unknown";
  confidence: number;
  snippet: string;
  source?: string;
  signalSource?: string;
  citationSentences?: string[];
}

interface PaperInspectorProps {
  paper: PaperData | null;
  evidence?: EvidenceItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToProject?: (id: string) => void;
  // Layout props for responsive behavior
  side?: "right" | "left" | "bottom";
  className?: string;
}

export const PaperInspector = memo(function PaperInspector({
  paper,
  evidence = [],
  open,
  onOpenChange,
  onAddToProject,
  side = "right",
  className,
}: PaperInspectorProps) {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch AI summary on-demand when paper opens
  useEffect(() => {
    if (!open || !paper || paper.aiSummary || !paper.abstract || aiSummary)
      return;
    // Reset when paper changes
    let cancelled = false;
    setSummaryLoading(true);
    setAiSummary(null);

    fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: paper.title,
        abstract: paper.abstract,
        year: paper.year,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.summary) {
          setAiSummary(data.summary);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, paper?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset summary when paper changes
  useEffect(() => {
    setAiSummary(null);
    setSummaryLoading(false);
  }, [paper?.id]);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  if (!paper) return null;

  const displaySummary = paper.aiSummary || aiSummary;

  // Parse authors for display
  const authorList = paper.authors.split(",").map((a) => a.trim());
  const displayAuthors =
    authorList.length > 3
      ? `${authorList.slice(0, 3).join(", ")} +${authorList.length - 3} more`
      : authorList.join(", ");

  return (
    <ContainedPanel
      open={open}
      onOpenChange={onOpenChange}
      side={side}
      className={cn("max-w-2xl", className)}
    >
      <ContainedPanelContent className="overflow-y-auto p-0">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="border-border/40 mb-0 border-b pb-5">
            {/* Badges row */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {paper.status === "ghost" && (
                <Badge
                  variant="outline"
                  className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 cursor-pointer transition-colors"
                  onClick={() => onAddToProject?.(paper.id)}
                >
                  Suggestion
                </Badge>
              )}
              {paper.supports > paper.refutes * 2 && paper.supports > 0 && (
                <Badge className="bg-supports/10 text-supports border-supports/20 border">
                  Well-Supported
                </Badge>
              )}
              {paper.refutes > paper.supports && paper.refutes > 0 && (
                <Badge className="bg-contradicts/10 text-contradicts border-contradicts/20 border">
                  Contested
                </Badge>
              )}
            </div>

            {/* Title */}
            <h2 className="text-lg leading-snug font-bold">{paper.title}</h2>

            {/* Authors */}
            <p className="text-muted-foreground mt-2 text-sm">
              {displayAuthors}
            </p>

            {/* Metadata row */}
            <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
              <span className="text-foreground/80 font-medium">
                {paper.year}
              </span>
              {paper.venue && (
                <Badge
                  variant="secondary"
                  className="px-2 py-0 text-xs font-normal"
                >
                  {paper.venue}
                </Badge>
              )}
              {paper.arxivId && (
                <button
                  onClick={() => copyToClipboard(paper.arxivId!, "arxiv")}
                  className="hover:text-foreground group flex items-center gap-1 font-mono transition-colors"
                >
                  <span>arXiv:{paper.arxivId}</span>
                  {copiedField === "arxiv" ? (
                    <Check className="text-supports h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </button>
              )}
              {paper.doi && (
                <button
                  onClick={() => copyToClipboard(paper.doi!, "doi")}
                  className="hover:text-foreground group flex items-center gap-1 font-mono transition-colors"
                >
                  <LinkIcon className="h-3 w-3" />
                  <span className="max-w-[120px] truncate">{paper.doi}</span>
                  {copiedField === "doi" ? (
                    <Check className="text-supports h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </button>
              )}
            </div>

            {/* Stats row — compact inline */}
            <div className="mt-4 grid grid-cols-4 gap-3">
              <StatCard label="Citations" value={paper.citations} />
              <StatCard label="References" value={paper.references || 0} />
              <StatCard
                label="Supports"
                value={paper.supports}
                color="text-supports"
              />
              <StatCard
                label="Refutes"
                value={paper.refutes}
                color="text-contradicts"
              />
            </div>

            {/* Add to Project CTA */}
            {paper.status === "ghost" && onAddToProject && (
              <Button
                size="sm"
                className="mt-4 w-full"
                onClick={() => onAddToProject(paper.id)}
              >
                Add to Project
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="evidence" className="mt-0">
          <div className="border-border/40 border-b px-6">
            <TabsList className="h-auto w-full justify-start gap-0 bg-transparent p-0">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-primary gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <Network className="h-3.5 w-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="evidence"
                className="data-[state=active]:border-primary gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <Quote className="h-3.5 w-3.5" />
                Evidence
              </TabsTrigger>
              <TabsTrigger
                value="cite"
                className="data-[state=active]:border-primary gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Cite
              </TabsTrigger>
              <TabsTrigger
                value="context"
                className="data-[state=active]:border-primary gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <Upload className="h-3.5 w-3.5" />
                Context
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0 space-y-5 p-6">
            {/* AI Summary */}
            {(displaySummary || summaryLoading) && (
              <div className="bg-muted/30 rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    AI TL;DR
                  </span>
                </div>
                {summaryLoading ? (
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span className="border-muted-foreground/30 border-t-muted-foreground h-4 w-4 animate-spin rounded-full border-2" />
                    Generating summary...
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm leading-relaxed italic">
                    {displaySummary}
                  </p>
                )}
              </div>
            )}

            {/* Abstract */}
            {paper.abstract && (
              <div>
                <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  Abstract
                </h4>
                <p className="text-foreground/80 text-sm leading-relaxed">
                  {paper.abstract}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Evidence Tab — Table Layout */}
          <TabsContent value="evidence" className="mt-0">
            {/* Table Header */}
            <div className="border-border/40 bg-muted/30 grid grid-cols-[1fr_90px_70px] gap-2 border-b px-6 py-2.5">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Source Paper
              </span>
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Relation
              </span>
              <span className="text-muted-foreground text-right text-[10px] font-bold tracking-wider uppercase">
                Confidence
              </span>
            </div>

            {/* Evidence Rows */}
            {evidence.length > 0 ? (
              <div className="divide-border/30 divide-y">
                {[...evidence]
                  .sort((a, b) => b.confidence - a.confidence)
                  .map((item) => (
                    <EvidenceRow key={item.id} item={item} />
                  ))}
              </div>
            ) : (
              <div className="text-muted-foreground px-6 py-12 text-center">
                <Quote className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No evidence available for this paper.</p>
              </div>
            )}
          </TabsContent>

          {/* Cite Tab */}
          <TabsContent value="cite" className="mt-0 space-y-4 p-6">
            <div className="bg-muted/30 overflow-x-auto rounded-lg border p-4 font-mono text-xs">
              <pre className="whitespace-pre-wrap">
                {`@article{${paper.id.replace("#", "")},
  title={${paper.title}},
  author={${paper.authors}},
  year={${paper.year}},
  ${paper.venue ? `journal={${paper.venue}},` : ""}
  ${paper.arxivId ? `eprint={${paper.arxivId}},` : ""}
}`}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const bibtex = `@article{${paper.id.replace("#", "")},\n  title={${paper.title}},\n  author={${paper.authors}},\n  year={${paper.year}},\n  ${paper.venue ? `journal={${paper.venue}},` : ""}\n  ${paper.doi ? `doi={${paper.doi}},` : ""}\n}`;
                  const blob = new Blob([bibtex], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${paper.id}.bib`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4" />
                Export BibTeX
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const bibtex = `@article{${paper.id.replace("#", "")},\n  title={${paper.title}},\n  author={${paper.authors}},\n  year={${paper.year}},\n  ${paper.venue ? `journal={${paper.venue}},` : ""}\n  ${paper.doi ? `doi={${paper.doi}},` : ""}\n}`;
                  copyToClipboard(bibtex, "bibtex");
                }}
              >
                {copiedField === "bibtex" ? (
                  <Check className="text-supports h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiedField === "bibtex" ? "Copied" : "Copy"}
              </Button>
            </div>
          </TabsContent>

          {/* Context/Upload Tab */}
          <TabsContent value="context" className="mt-0 space-y-6 p-6">
            <div className="border-border bg-card/50 hover:bg-card/80 group cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all">
              <div className="bg-primary/10 group-hover:bg-primary/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full transition-colors">
                <Upload className="text-primary h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Upload PDF Context</h3>
              <p className="text-muted-foreground mx-auto mb-4 max-w-xs text-sm">
                Drag and drop the full text PDF to enable deep AI analysis and
                extraction.
              </p>
              <Button>Select File</Button>
            </div>

            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                Analysis Capabilities (Locked)
              </h4>
              <ul className="space-y-2.5">
                {[
                  "Full-text extraction",
                  "Methodology analysis",
                  "Figure interpretation",
                  "Citation graph expansion",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="text-muted-foreground flex items-center gap-2 text-sm"
                  >
                    <div className="bg-border h-1.5 w-1.5 rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="border-border/40 bg-muted/20 flex gap-2 border-t p-4">
          {paper.openAccessUrl && (
            <Button
              className="flex-1 gap-2"
              onClick={() => window.open(paper.openAccessUrl, "_blank")}
            >
              <FileText className="h-4 w-4" />
              Open PDF
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => {
              const url = paper.doi
                ? `https://doi.org/${paper.doi}`
                : `https://openalex.org/${paper.id}`;
              window.open(url, "_blank");
            }}
          >
            <ExternalLink className="h-4 w-4" />
            View Source
          </Button>
        </div>
      </ContainedPanelContent>
    </ContainedPanel>
  );
});

// Stat Card Component — compact inline
function StatCard({
  label,
  value,
  color = "text-foreground",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="border-border/40 bg-card/30 rounded-lg border p-3">
      <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase">
        {label}
      </p>
      <span className={`text-xl font-bold tracking-tight ${color}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

// Keyword highlighting for evidence snippets
const HIGHLIGHT_KEYWORDS: Record<string, string[]> = {
  supports: [
    "supports",
    "validates",
    "confirms",
    "consistent",
    "agreement",
    "builds upon",
    "aligns",
  ],
  refutes: [
    "however",
    "contrary",
    "unlike",
    "conflict",
    "disagree",
    "refutes",
    "challenges",
    "contradicts",
    "does not",
  ],
  extends: [
    "extends",
    "builds on",
    "following",
    "based on",
    "expands",
    "generalizes",
  ],
  cites: [],
};

function highlightSnippet(text: string, relation: EvidenceItem["relation"]) {
  const relKey = relation === "refutes" ? "refutes" : relation;
  const keywords = HIGHLIGHT_KEYWORDS[relKey] || [];
  if (keywords.length === 0) return text;

  const colorMap: Record<string, string> = {
    supports: "bg-supports/20 text-supports font-semibold",
    refutes: "bg-contradicts/20 text-contradicts font-semibold",
    extends: "bg-extends/20 text-extends font-semibold",
  };
  const cls = colorMap[relKey] || "";

  const pattern = new RegExp(`(${keywords.join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, i) =>
    keywords.some((k) => k.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className={`${cls} rounded-sm px-0.5 no-underline`}>
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

// Evidence Row Component — table layout matching design 2
function EvidenceRow({ item }: { item: EvidenceItem }) {
  const relationConfig: Record<
    string,
    { color: string; bgColor: string; barColor: string; label: string }
  > = {
    supports: {
      color: "text-supports",
      bgColor: "bg-supports/10",
      barColor: "bg-supports",
      label: "SUPPORTS",
    },
    refutes: {
      color: "text-contradicts",
      bgColor: "bg-contradicts/10",
      barColor: "bg-contradicts",
      label: "REFUTES",
    },
    extends: {
      color: "text-extends",
      bgColor: "bg-extends/10",
      barColor: "bg-extends",
      label: "EXTENDS",
    },
    unknown: {
      color: "text-muted-foreground",
      bgColor: "bg-muted/20",
      barColor: "bg-muted-foreground/50",
      label: "UNKNOWN",
    },
    cites: {
      color: "text-muted-foreground",
      bgColor: "bg-muted/10",
      barColor: "bg-muted-foreground/30",
      label: "CITES",
    },
  };

  const config = relationConfig[item.relation] || relationConfig.unknown;

  return (
    <div className="hover:bg-muted/30 group grid grid-cols-[1fr_90px_70px] gap-2 px-6 py-4 transition-colors">
      {/* Source Paper + Snippet */}
      <div className="min-w-0">
        <p className="text-foreground/90 text-sm leading-tight font-semibold">
          {item.sourcePaper.authors.split(",")[0]?.trim()} (
          {item.sourcePaper.year})
        </p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {item.sourcePaper.title}
        </p>
        {/* Snippet with keyword highlighting */}
        <div className="mt-2">
          <p className="text-foreground/70 text-xs leading-relaxed italic">
            &ldquo;{highlightSnippet(item.snippet, item.relation)}&rdquo;
          </p>
          {/* Citation sentences from Semantic Scholar */}
          {item.citationSentences && item.citationSentences.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {item.citationSentences.slice(0, 2).map((s, i) => (
                <p
                  key={i}
                  className="text-foreground/60 border-muted-foreground/20 border-l-2 pl-2 text-[11px] leading-relaxed"
                >
                  {s}
                </p>
              ))}
            </div>
          )}
          {/* Signal source + provider */}
          <div className="mt-1 flex items-center gap-2">
            {item.signalSource && (
              <span className="text-muted-foreground/60 bg-muted/40 rounded px-1.5 py-0.5 text-[10px]">
                {item.signalSource === "llm+contexts"
                  ? "LLM + citation contexts"
                  : item.signalSource === "llm+abstracts"
                    ? "LLM + abstracts"
                    : item.signalSource === "llm+titles"
                      ? "LLM + titles only"
                      : item.signalSource === "heuristic"
                        ? "Heuristic"
                        : item.signalSource === "user-correction"
                          ? "User corrected"
                          : "Default"}
              </span>
            )}
            {item.source && (
              <p className="text-muted-foreground/60 flex items-center gap-1 text-[10px]">
                <LinkIcon className="h-2.5 w-2.5" />
                {item.source}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Relation Badge */}
      <div className="flex items-start pt-0.5">
        <Badge
          className={`${config.bgColor} ${config.color} border-0 px-2 py-0.5 text-[10px] font-bold tracking-wide`}
        >
          {config.label}
        </Badge>
      </div>

      {/* Confidence Bar */}
      <div className="flex flex-col items-end gap-1 pt-0.5">
        <span className={`font-mono text-sm font-bold ${config.color}`}>
          {item.confidence}%
        </span>
        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
          <div
            className={`h-full rounded-full ${config.barColor} transition-all duration-300`}
            style={{ width: `${item.confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
}
