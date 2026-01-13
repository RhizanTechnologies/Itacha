"use client";

import { useState } from "react";
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

export interface EdgeEvidence {
  id: string;
  edgeType: "supports" | "contradicts" | "extends";
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
  }[];
}

interface EdgeEvidencePopoverProps {
  evidence: EdgeEvidence | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onViewPaper: (paperId: string) => void;
  onDispute: (edgeId: string) => void;
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
};

export function EdgeEvidencePopover({
  evidence,
  position,
  onClose,
  onViewPaper,
  onDispute,
}: EdgeEvidencePopoverProps) {
  const [activeSnippet, setActiveSnippet] = useState(0);

  if (!evidence || !position) return null;

  const config = EDGE_CONFIG[evidence.edgeType];
  const Icon = config.icon;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Popover */}
      <div
        className={`fixed z-50 w-96 bg-card/95 backdrop-blur border ${config.borderColor} rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200`}
        style={{
          left: Math.min(position.x, window.innerWidth - 420),
          top: Math.min(position.y, window.innerHeight - 400),
        }}
      >
        {/* Header */}
        <div className={`${config.bgColor} p-4 border-b ${config.borderColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <span className={`font-bold ${config.color}`}>{config.label}</span>
            <Badge 
              variant="secondary" 
              className={`ml-auto ${config.bgColor} ${config.color} border-0`}
            >
              {evidence.confidence}% confidence
            </Badge>
          </div>
          
          {/* Papers */}
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground shrink-0 mt-0.5">From:</span>
              <button
                onClick={() => onViewPaper(evidence.sourcePaper.id)}
                className="text-left hover:text-primary transition-colors line-clamp-1"
              >
                {evidence.sourcePaper.title}
              </button>
            </div>
            <div className="flex items-center justify-center">
              <ChevronRight className={`h-4 w-4 ${config.color}`} />
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground shrink-0 mt-0.5">To:</span>
              <button
                onClick={() => onViewPaper(evidence.targetPaper.id)}
                className="text-left hover:text-primary transition-colors line-clamp-1"
              >
                {evidence.targetPaper.title}
              </button>
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
                        idx === activeSnippet ? config.bgColor.replace("/10", "") : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Current Snippet */}
              <div className={`p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
                <p className="text-sm italic leading-relaxed">
                  "{evidence.snippets[activeSnippet].text}"
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  — {evidence.snippets[activeSnippet].source}
                </p>
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
            onClick={() => onDispute(evidence.id)}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Dispute
          </Button>
        </div>
      </div>
    </>
  );
}
