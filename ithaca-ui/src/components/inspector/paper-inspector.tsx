"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
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
  relation: "supports" | "refutes" | "extends";
  confidence: number;
  snippet: string;
  source?: string;
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

export function PaperInspector({
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
    if (!open || !paper || paper.aiSummary || !paper.abstract || aiSummary) return;
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

  if (!paper) return null;

  const displaySummary = paper.aiSummary || aiSummary;

  return (
    <ContainedPanel
      open={open}
      onOpenChange={onOpenChange}
      side={side}
      className={cn("max-w-2xl", className)}
    >
      <ContainedPanelContent className="p-6 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border/40 pb-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            {paper.status === "ghost" && (
              <Badge
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => onAddToProject?.(paper.id)}
              >
                Suggestion (Click to Add)
              </Badge>
            )}
            {paper.supports > paper.refutes * 2 && (
              <Badge className="bg-supports/10 text-supports border-supports/20">
                Well-Supported
              </Badge>
            )}
            <Badge variant="outline" className="font-mono text-xs">
              {paper.id}
            </Badge>
          </div>
          <h2 className="text-xl font-bold leading-tight flex justify-between items-start gap-4">
            <span>{paper.title}</span>
            {paper.status === "ghost" && onAddToProject && (
              <Button size="sm" onClick={() => onAddToProject(paper.id)}>
                Add to Project
              </Button>
            )}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-2">
            <span>{paper.authors}</span>
            <span>•</span>
            <span>{paper.year}</span>
            {paper.venue && (
              <>
                <span>•</span>
                <Badge variant="secondary">{paper.venue}</Badge>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="evidence" className="mt-6">
          <TabsList className="w-full justify-start bg-muted/50">
            <TabsTrigger value="overview" className="gap-1.5">
              <Network className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="evidence" className="gap-1.5">
              <Quote className="h-3.5 w-3.5" />
              Evidence
            </TabsTrigger>
            <TabsTrigger value="cite" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Cite
            </TabsTrigger>
            <TabsTrigger value="context" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Context
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Citations" value={paper.citations} />
              <StatCard label="References" value={paper.references || 0} />
              <StatCard
                label="Supports"
                value={paper.supports}
                trend="up"
                color="text-supports"
              />
              <StatCard
                label="Refutes"
                value={paper.refutes}
                trend="down"
                color="text-contradicts"
              />
            </div>

            {/* AI Summary */}
            {(displaySummary || summaryLoading) && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    <span className="mr-1">✨</span> AI TL;DR
                  </Badge>
                </div>
                {summaryLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                    Generating summary...
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {displaySummary}
                  </p>
                )}
              </div>
            )}

            {/* Abstract */}
            {paper.abstract && (
              <div>
                <h4 className="font-semibold mb-2">Abstract</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {paper.abstract}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Evidence Tab */}
          <TabsContent value="evidence" className="mt-6">
            <div className="space-y-4">
              {/* Evidence Header */}
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">
                  Source Papers ({evidence.length})
                </h4>
                <Badge variant="outline" className="text-xs">
                  Sorted by Confidence
                </Badge>
              </div>

              {/* Evidence List */}
              {evidence.length > 0 ? (
                <div className="space-y-3">
                  {evidence.map((item) => (
                    <EvidenceCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Quote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    No evidence available for this paper.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Cite Tab */}
          <TabsContent value="cite" className="mt-6 space-y-4">
            <div className="p-4 rounded-lg border bg-muted/30 font-mono text-xs overflow-x-auto">
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
            <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              const bibtex = `@article{${paper.id.replace("#", "")},\n  title={${paper.title}},\n  author={${paper.authors}},\n  year={${paper.year}},\n  ${paper.venue ? `journal={${paper.venue}},` : ""}\n  ${paper.doi ? `doi={${paper.doi}},` : ""}\n}`;
              const blob = new Blob([bibtex], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${paper.id}.bib`;
              a.click();
              URL.revokeObjectURL(url);
            }}>
              <Download className="h-4 w-4" />
              Export BibTeX
            </Button>
          </TabsContent>

          {/* Context/Upload Tab */}
          <TabsContent value="context" className="mt-6 space-y-6">
            <div className="p-6 border-2 border-dashed border-border rounded-xl bg-card/50 hover:bg-card/80 transition-all text-center group cursor-pointer">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Upload PDF Context</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                Drag and drop the full text PDF to enable deep AI analysis and
                extraction.
              </p>
              <Button>Select File</Button>
            </div>

            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
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
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-border" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex gap-2 mt-8 pt-4 border-t">
          {paper.openAccessUrl && (
            <Button className="flex-1 gap-2" onClick={() => window.open(paper.openAccessUrl, "_blank")}>
              <FileText className="h-4 w-4" />
              Open PDF
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={() => {
            const url = paper.doi
              ? `https://doi.org/${paper.doi}`
              : `https://openalex.org/${paper.id}`;
            window.open(url, "_blank");
          }}>
            <ExternalLink className="h-4 w-4" />
            View Source
          </Button>
        </div>
      </ContainedPanelContent>
    </ContainedPanel>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  trend,
  color = "text-foreground",
}: {
  label: string;
  value: number;
  trend?: "up" | "down";
  color?: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 transition-colors shadow-sm">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5 opacity-80">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold tracking-tight ${color}`}>
          {value.toLocaleString()}
        </span>
        {trend && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${trend === "up" ? "bg-supports/10 text-supports" : "bg-contradicts/10 text-contradicts"}`}
          >
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}

// Evidence Card Component
function EvidenceCard({ item }: { item: EvidenceItem }) {
  const relationConfig = {
    supports: {
      icon: CheckCircle,
      color: "text-supports",
      bgColor: "bg-supports/10",
      label: "SUPPORTS",
    },
    refutes: {
      icon: XCircle,
      color: "text-contradicts",
      bgColor: "bg-contradicts/10",
      label: "REFUTES",
    },
    extends: {
      icon: ArrowRightCircle,
      color: "text-extends",
      bgColor: "bg-extends/10",
      label: "EXTENDS",
    },
  };

  const config = relationConfig[item.relation];
  const Icon = config.icon;

  return (
    <div className="p-5 rounded-xl border border-border/60 bg-card/40 hover:bg-card/90 transition-all hover:shadow-md group">
      <div className="flex items-start justify-between gap-5">
        <div className="flex-1 min-w-0">
          {/* Source Paper */}
          <div className="flex items-center gap-3 mb-3">
            <span className="font-semibold text-sm truncate text-foreground/90">
              {item.sourcePaper.authors.split(",")[0]} ({item.sourcePaper.year})
            </span>
            <Badge
              className={`${config.bgColor} ${config.color} border-0 font-bold px-2 py-0.5 text-[10px] tracking-wide`}
            >
              {config.label}
            </Badge>
          </div>
          <p className="text-xs font-medium text-foreground/70 mb-3 truncate leading-relaxed">
            {item.sourcePaper.title}
          </p>

          {/* Evidence Snippet */}
          <div className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-muted-foreground/20 rounded-full group-hover:bg-primary/30 transition-colors" />
            <blockquote className="text-sm italic text-muted-foreground/90 leading-relaxed">
              "{item.snippet}"
            </blockquote>
            {item.source && (
              <cite className="block text-xs text-muted-foreground/60 mt-1.5 not-italic font-medium">
                {item.source}
              </cite>
            )}
          </div>
        </div>

        {/* Confidence */}
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <div
            className={`text-lg font-bold font-mono ${config.color} bg-background/50 px-2 py-1 rounded border border-border/30`}
          >
            {item.confidence}%
          </div>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-medium">
            Confidence
          </p>
        </div>
      </div>
    </div>
  );
}
