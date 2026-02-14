"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  ArrowRightCircle,
  ExternalLink,
  Quote,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

import type { SignalSource } from "@/lib/api/graph-api";

export interface EdgeEvidence {
  id: string;
  edgeType: "supports" | "contradicts" | "extends" | "unknown";
  confidence: number;
  sourcePaper: {
    id: string;
    title: string;
    authors: string;
    year: number;
  };
  targetPaper: {
    id: string;
    title: string;
    authors: string;
    year: number;
  };
  snippets: {
    text: string;
    source: string;
    context?: "Introduction" | "Methodology" | "Results" | "Discussion" | "Background" | "ResultComparison";
  }[];
  /** What data the classifier had when making this judgment */
  signalSource?: SignalSource;
}

interface EdgeEvidencePopoverProps {
  evidence: EdgeEvidence | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onViewPaper: (paperId: string) => void;
  onDispute: (edgeId: string) => void;
  onCorrect?: (edgeId: string, type: string, comment: string) => void;
}

const EDGE_CONFIG = {
  supports: {
    icon: CheckCircle,
    label: "Supports",
    color: "text-supports",
    bgColor: "bg-supports/10",
    borderColor: "border-supports/30",
  },
  contradicts: {
    icon: XCircle,
    label: "Contradicts",
    color: "text-contradicts",
    bgColor: "bg-contradicts/10",
    borderColor: "border-contradicts/30",
  },
  extends: {
    icon: ArrowRightCircle,
    label: "Extends",
    color: "text-extends",
    bgColor: "bg-extends/10",
    borderColor: "border-extends/30",
  },
  unknown: {
    icon: AlertTriangle,
    label: "Uncertain",
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
    borderColor: "border-muted-foreground/30",
  },
};

export const SIGNAL_SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  "llm+contexts": { label: "AI + citation sentences", color: "text-emerald-600 dark:text-emerald-400" },
  "llm+abstracts": { label: "AI + abstracts only", color: "text-blue-600 dark:text-blue-400" },
  "llm+titles": { label: "AI + titles only", color: "text-amber-600 dark:text-amber-400" },
  "heuristic": { label: "Keyword heuristic", color: "text-orange-600 dark:text-orange-400" },
  "user-correction": { label: "User corrected", color: "text-purple-600 dark:text-purple-400" },
  "default": { label: "Unclassified", color: "text-muted-foreground" },
};

export function EdgeEvidencePopover({
  evidence,
  position,
  onClose,
  onViewPaper,
  onDispute,
  onCorrect,
}: EdgeEvidencePopoverProps) {
  const [activeSnippet, setActiveSnippet] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  // Reset local state when evidence changes (new edge clicked)
  const evidenceId = evidence?.id ?? null;
  React.useEffect(() => {
    setActiveSnippet(0);
    setIsEditing(false);
    setSelectedType(evidence?.edgeType ?? null);
    setComment("");
  }, [evidenceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper to highlight keywords
  const highlightText = (text: string, type: EdgeEvidence["edgeType"]) => {
    const config = EDGE_CONFIG[type];

    const keywords =
      type === "contradicts"
        ? ["however", "contrary", "unlike", "conflict", "disagree", "refutes"]
        : type === "supports"
          ? ["supports", "validates", "confirms", "agreement", "consistent"]
          : ["extends", "builds on", "following", "based on"];

    const parts = text.split(new RegExp(`(${keywords.join("|")})`, "gi"));
    return parts.map((part, i) =>
      keywords.some((k) => k.toLowerCase() === part.toLowerCase()) ? (
        <span
          key={i}
          className={`font-bold ${config.color} bg-muted/50 px-1 rounded`}
        >
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  if (!evidence || !position) return null;

  const config = EDGE_CONFIG[evidence.edgeType];
  const Icon = config.icon;

  const handleSubmitCorrection = () => {
    if (onCorrect && selectedType) {
      onCorrect(evidence.id, selectedType, comment);
      onClose(); // Close after submit
    } else {
      // Fallback if no specific correct handler
      onDispute(evidence.id);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popover */}
      <div
        className={`fixed z-50 w-96 bg-card/95 backdrop-blur border ${config.borderColor} rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 flex flex-col max-h-[85vh]`}
        style={{
          left: Math.min(position.x, window.innerWidth - 400),
          top: Math.min(position.y, window.innerHeight - 500),
        }}
      >
        {isEditing ? (
          // ================= EDIT MODE =================
          <div className="p-0">
            <div className="bg-muted/40 p-4 border-b border-border">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Correct Relationship
              </h3>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Relationship Type
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(
                    Object.keys(EDGE_CONFIG) as Array<keyof typeof EDGE_CONFIG>
                  ).map((type) => {
                    const TypeIcon = EDGE_CONFIG[type].icon;
                    const isSelected = selectedType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
                          isSelected
                            ? `bg-primary/5 border-primary ring-1 ring-primary`
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <TypeIcon
                          className={`h-4 w-4 ${EDGE_CONFIG[type].color}`}
                        />
                        <span className="text-sm font-medium">
                          {EDGE_CONFIG[type].label}
                        </span>
                        {isSelected && (
                          <CheckCircle className="h-3.5 w-3.5 ml-auto text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reasoning (Optional)
                </label>
                <textarea
                  className="w-full h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Why is the current relationship incorrect?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 bg-muted/50 p-2 rounded">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                  This correction applies only to your private workspace.
                </p>
              </div>
            </div>
            <div className="p-3 border-t bg-muted/20 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitCorrection}
                disabled={!selectedType}
              >
                Submit Correction
              </Button>
            </div>
          </div>
        ) : (
          // ================= VIEW MODE =================
          <>
            {/* Header */}
            <div
              className={`${config.bgColor} p-4 border-b ${config.borderColor}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-5 w-5 ${config.color}`} />
                <span className={`font-bold ${config.color}`}>
                  {config.label}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <span className={`text-sm font-bold font-mono ${config.color}`}>
                    {evidence.confidence}%
                  </span>
                </div>
              </div>
              {/* Confidence Bar */}
              <div className="w-full h-1.5 bg-background/30 rounded-full overflow-hidden mt-1 mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${config.bgColor.replace('/10', '')}`}
                  style={{ width: `${evidence.confidence}%` }}
                />
              </div>

              {/* Signal Source Badge — shows what data the classifier had */}
              {evidence.signalSource && (
                <div className="mb-3">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-background/50 ${SIGNAL_SOURCE_LABELS[evidence.signalSource]?.color ?? "text-muted-foreground"}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                    {SIGNAL_SOURCE_LABELS[evidence.signalSource]?.label ?? "Unknown source"}
                  </span>
                </div>
              )}

              {/* Papers */}
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground shrink-0 mt-0.5 text-xs font-medium w-10">
                    From
                  </span>
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => onViewPaper(evidence.sourcePaper.id)}
                      className="text-left hover:text-primary transition-colors block">
                      <span className="font-semibold text-sm">
                        {evidence.sourcePaper.authors.split(",")[0]?.trim()} ({evidence.sourcePaper.year})
                      </span>
                    </button>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{evidence.sourcePaper.title}</p>
                  </div>
                </div>
                <div className="flex items-center pl-10">
                  <ChevronRight className={`h-3.5 w-3.5 ${config.color}`} />
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground shrink-0 mt-0.5 text-xs font-medium w-10">
                    To
                  </span>
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => onViewPaper(evidence.targetPaper.id)}
                      className="text-left hover:text-primary transition-colors block">
                      <span className="font-semibold text-sm">
                        {evidence.targetPaper.authors.split(",")[0]?.trim()} ({evidence.targetPaper.year})
                      </span>
                    </button>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{evidence.targetPaper.title}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence Snippets */}
            <div className="p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
                <Quote className="h-3 w-3" />
                Evidence ({evidence.snippets.length})
              </h4>

              {evidence.snippets.length > 0 ? (
                <>
                  {/* Snippet Navigation */}
                  {evidence.snippets.length > 1 && (
                    <div className="flex gap-1 mb-3">
                      {evidence.snippets.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveSnippet(idx)}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            idx === activeSnippet
                              ? config.bgColor.replace("/10", "")
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Current Snippet - Paper Style */}
                  <div
                    className={`relative p-4 rounded-sm border ${config.borderColor} bg-card shadow-sm font-serif`}
                  >
                    {/* Paper texture/context header */}
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-black/5 to-transparent" />

                    {evidence.snippets[activeSnippet].context && (
                      <span className="absolute -top-2.5 right-4 px-2 py-0.5 text-[10px] uppercase tracking-wider font-sans bg-background border border-border text-muted-foreground rounded-full">
                        {evidence.snippets[activeSnippet].context}
                      </span>
                    )}

                    <p className="text-sm leading-relaxed text-foreground/90">
                      "...
                      {highlightText(
                        evidence.snippets[activeSnippet].text,
                        evidence.edgeType,
                      )}
                      ..."
                    </p>

                    <div className="mt-3 flex items-center justify-end font-sans">
                      <span className="text-xs font-medium text-foreground/70">
                        {evidence.snippets[activeSnippet].source}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No evidence snippets available
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-3 border-t border-border bg-muted/30 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => onViewPaper(evidence.sourcePaper.id)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Source
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setIsEditing(true);
                  setSelectedType(evidence.edgeType);
                }}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Dispute / Edit
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
