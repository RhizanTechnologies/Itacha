"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
} from "lucide-react";

// Paper data interface
export interface PaperData {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue?: string;
  arxivId?: string;
  citations: number;
  references?: number;
  supports: number;
  refutes: number;
  abstract?: string;
  aiSummary?: string;
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
}

export function PaperInspector({ paper, evidence = [], open, onOpenChange }: PaperInspectorProps) {
  if (!paper) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center gap-2 mb-2">
            {paper.supports > paper.refutes * 2 && (
              <Badge className="bg-supports/10 text-supports border-supports/20">
                Well-Supported
              </Badge>
            )}
            <Badge variant="outline" className="font-mono text-xs">
              {paper.id}
            </Badge>
          </div>
          <SheetTitle className="text-xl font-bold leading-tight">
            {paper.title}
          </SheetTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
        </SheetHeader>

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
            {paper.aiSummary && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    <span className="mr-1">✨</span> AI TL;DR
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {paper.aiSummary}
                </p>
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
                  <p className="text-sm">No evidence available for this paper.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Cite Tab */}
          <TabsContent value="cite" className="mt-6 space-y-4">
            <div className="p-4 rounded-lg border bg-muted/30 font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap">
{`@article{${paper.id.replace('#', '')},
  title={${paper.title}},
  author={${paper.authors}},
  year={${paper.year}},
  ${paper.venue ? `journal={${paper.venue}},` : ''}
  ${paper.arxivId ? `eprint={${paper.arxivId}},` : ''}
}`}
              </pre>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export BibTeX
            </Button>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex gap-2 mt-8 pt-4 border-t">
          <Button className="flex-1 gap-2">
            <FileText className="h-4 w-4" />
            Open PDF
          </Button>
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View Source
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Stat Card Component
function StatCard({ 
  label, 
  value, 
  trend,
  color = "text-foreground"
}: { 
  label: string; 
  value: number; 
  trend?: "up" | "down";
  color?: string;
}) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold font-mono ${color}`}>
          {value.toLocaleString()}
        </span>
        {trend && (
          <span className={`text-xs ${trend === "up" ? "text-supports" : "text-contradicts"}`}>
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
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
    <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Source Paper */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm truncate">
              {item.sourcePaper.authors.split(",")[0]} ({item.sourcePaper.year})
            </span>
            <Badge className={`${config.bgColor} ${config.color} text-[10px]`}>
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2 truncate">
            {item.sourcePaper.title}
          </p>
          
          {/* Evidence Snippet */}
          <blockquote className="text-sm italic border-l-2 border-muted pl-3 py-1">
            "{item.snippet}"
            {item.source && (
              <cite className="block text-xs text-muted-foreground mt-1 not-italic">
                — {item.source}
              </cite>
            )}
          </blockquote>
        </div>

        {/* Confidence */}
        <div className="text-right shrink-0">
          <span className={`text-lg font-bold font-mono ${config.color}`}>
            {item.confidence}%
          </span>
          <p className="text-[9px] uppercase text-muted-foreground">Confidence</p>
        </div>
      </div>
    </div>
  );
}
