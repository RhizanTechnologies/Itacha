"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  Search,
  ArrowUpDown,
  Calendar,
  Quote,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PaperData } from "@/components/inspector/paper-inspector";

interface PaperListPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  papers: PaperData[];
  hoveredNode: string | null;
  onHoverNode: (nodeId: string | null) => void;
  onSelectNode: (nodeId: string) => void;
  className?: string; // For adding responsive classes
}

type SortField = "citation" | "year" | "title";
type SortOrder = "asc" | "desc";

export const PaperListPanel = memo(function PaperListPanel({
  open,
  onOpenChange,
  papers,
  hoveredNode,
  onHoverNode,
  onSelectNode,
  className,
}: PaperListPanelProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("citation");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Reset search when closed to be clean? Optionally.

  // Filter and Sort
  const filteredAndSortedPapers = useMemo(() => {
    let result = [...papers];

    // Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q) ||
          p.year.toString().includes(q),
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA: any = a.citations;
      let valB: any = b.citations;

      if (sortField === "year") {
        valA = a.year;
        valB = b.year;
      } else if (sortField === "title") {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [papers, search, sortField, sortOrder]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
        onClick={() => onOpenChange(false)}
      />

      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full md:w-[400px] border-l bg-card shadow-2xl transition-transform duration-300 ease-in-out",
          !open && "translate-x-full",
          "flex flex-col",
          className,
        )}
      >
        {/* Header */}
        <div className="p-4 border-b space-y-4 bg-muted/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-lg">Papers</h2>
              <Badge
                variant="secondary"
                className="rounded-full px-2 py-0.5 text-xs"
              >
                {filteredAndSortedPapers.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search title, author, year..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Sort by:</span>
            <div className="flex gap-1 bg-background p-1 rounded-md border">
              <SortButton
                active={sortField === "citation"}
                onClick={() => {
                  if (sortField === "citation")
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  else {
                    setSortField("citation");
                    setSortOrder("desc");
                  }
                }}
                label="Cites"
                icon={<Quote className="h-3 w-3 mr-1" />}
              />
              <SortButton
                active={sortField === "year"}
                onClick={() => {
                  if (sortField === "year")
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  else {
                    setSortField("year");
                    setSortOrder("desc");
                  }
                }}
                label="Year"
                icon={<Calendar className="h-3 w-3 mr-1" />}
              />
              <SortButton
                active={sortField === "title"}
                onClick={() => {
                  if (sortField === "title")
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  else {
                    setSortField("title");
                    setSortOrder("asc");
                  }
                }}
                label="Name"
                icon={<FileText className="h-3 w-3 mr-1" />}
              />
            </div>
          </div>
        </div>

        {/* List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredAndSortedPapers.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No papers found matching "{search}"</p>
              </div>
            ) : (
              filteredAndSortedPapers.map((paper) => (
                <div
                  key={paper.id}
                  className={cn(
                    "group flex items-start gap-3 p-3 rounded-lg border border-transparent transition-all cursor-pointer",
                    hoveredNode === paper.id
                      ? "bg-primary/10 border-primary/20 shadow-sm"
                      : "hover:bg-muted/50 border-border/40",
                  )}
                  onMouseEnter={() => onHoverNode(paper.id)}
                  onMouseLeave={() => onHoverNode(null)}
                  onClick={() => {
                    onSelectNode(paper.id);
                    // On mobile, close list after selection?
                    // Maybe. But let's leave it open on desktop.
                    if (window.innerWidth < 768) onOpenChange(false);
                  }}
                >
                  <div
                    className={cn(
                      "w-1 self-stretch rounded-full transition-colors",
                      hoveredNode === paper.id
                        ? "bg-primary"
                        : "bg-transparent group-hover:bg-muted-foreground/30",
                    )}
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={cn(
                          "text-sm font-medium leading-tight line-clamp-2",
                          hoveredNode === paper.id
                            ? "text-primary"
                            : "text-foreground",
                        )}
                      >
                        {paper.title}
                      </h3>
                      {paper.id.startsWith("topic-") && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1"
                        >
                          Topic
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                      <span className="truncate max-w-[120px]">
                        {paper.authors.split(",")[0]} et al.
                      </span>
                      <span>•</span>
                      <span>{paper.year}</span>
                      <span className="ml-auto font-mono text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded text-[10px]">
                        {paper.citations} cites
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 transition-all",
                      hoveredNode === paper.id
                        ? "opacity-100 translate-x-0"
                        : "group-hover:opacity-50 group-hover:translate-x-0",
                    )}
                  />
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
});

function SortButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center px-2 py-1 rounded text-[10px] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "hover:bg-muted text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
