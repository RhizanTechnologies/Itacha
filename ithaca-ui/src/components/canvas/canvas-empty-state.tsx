"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ArrowRight, FileText, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { graphAPI, type SearchResult } from "@/lib/api/graph-api";
import type { RelationshipFocusType } from "@/components/canvas/relationship-focus-control";

interface CanvasEmptyStateProps {
  /** Callback when user selects a paper/topic from search */
  onSearchSelect?: (id: string) => void;
  /** Callback when user clicks the search prompt (fallback to ⌘K) */
  onSearchClick?: () => void;
  /** Optional custom message */
  message?: string;
  /** Whether to show the animated background */
  showAnimation?: boolean;
  /** Current relationship focus */
  relationshipFocus?: RelationshipFocusType;
  /** Callback when relationship focus changes */
  onRelationshipFocusChange?: (focus: RelationshipFocusType) => void;
}

// Curated topic suggestions shown before user types
const SUGGESTED_TOPICS = [
  "CRISPR gene editing",
  "Large language models",
  "Quantum computing",
  "Climate change mitigation",
  "Transformer architectures",
  "mRNA vaccines",
];

/**
 * Empty state shown when the graph canvas has no data to display.
 * Features an inline search with live suggestions matching the design spec.
 */
export function CanvasEmptyState({
  onSearchSelect,
  onSearchClick,
  message = "Search for a research topic to visually explore its citation network, discover connections, and analyze trends.",
  showAnimation = true,
  relationshipFocus = "all",
  onRelationshipFocusChange,
}: CanvasEmptyStateProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const r = await graphAPI.searchPapers(query);
        setResults(r);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = useCallback((id: string) => {
    setQuery("");
    setResults([]);
    setIsFocused(false);
    onSearchSelect?.(id);
  }, [onSearchSelect]);

  const handleTopicClick = useCallback((topic: string) => {
    handleSelect(`topic-${topic}`);
  }, [handleSelect]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSelect(`topic-${query.trim()}`);
    }
  }, [query, handleSelect]);

  // Separate papers and topics
  const papers = results.filter((r) => r.type === "paper");
  const topics = results.filter((r) => r.type === "topic");

  const showDropdown = isFocused && (results.length > 0 || isSearching);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      {/* Subtle dot grid */}
      {showAnimation && (
        <div className="absolute inset-0 overflow-hidden opacity-[0.04] dark:opacity-[0.06]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="empty-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="20" cy="20" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#empty-grid)" />
          </svg>
        </div>
      )}

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center w-full max-w-xl px-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Icon */}
        <div className="relative mb-5">
          <div className="bg-primary/8 p-5 rounded-2xl border border-primary/10">
            <Search className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Explore citation networks
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-md">{message}</p>

        {/* Inline Search Input */}
        <div className="w-full max-w-md relative">
          <form onSubmit={handleSubmit}>
            <div className={`relative flex items-center bg-background border rounded-xl shadow-lg transition-all ${
              isFocused ? "border-primary ring-2 ring-primary/20 shadow-xl" : "border-border hover:border-primary/40"
            }`}>
              <Search className="absolute left-4 h-4.5 w-4.5 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder="Search papers, topics, or authors..."
                className="w-full py-3.5 pl-11 pr-12 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none rounded-xl"
              />
              {query.trim() && (
                <button
                  type="submit"
                  className="absolute right-2.5 p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {isSearching && (
                <Loader2 className="absolute right-4 h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>
          </form>

          {/* Live Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-[320px] overflow-y-auto"
              >
                {/* Papers */}
                {papers.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-muted/30 border-b border-border/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Papers ({papers.length})
                      </span>
                    </div>
                    {papers.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelect(r.id)}
                        className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                      >
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground/60 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.authors} · {r.year}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Topics */}
                {topics.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-muted/30 border-b border-border/40 border-t border-t-border/20">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Topics ({topics.length})
                      </span>
                    </div>
                    {topics.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelect(r.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                      >
                        <Sparkles className="h-4 w-4 text-blue-500/60 shrink-0" />
                        <span className="text-sm font-medium">{r.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Searching indicator */}
                {isSearching && results.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <Loader2 className="h-5 w-5 mx-auto mb-2 text-muted-foreground animate-spin" />
                    <p className="text-xs text-muted-foreground">Searching...</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Keyboard hint */}
        <p className="mt-3 text-xs text-muted-foreground">
          or press{" "}
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">⌘K</kbd>
          {" "}for advanced search
        </p>

        {/* Suggested topics */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Try:</span>
          {SUGGESTED_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicClick(topic)}
              className="px-3 py-1 rounded-full border border-border bg-card/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              {topic}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Compact empty state for inline usage (e.g., search results, filters)
 */
export function EmptyStateCompact({
  message = "No results found",
  suggestion,
}: {
  message?: string;
  suggestion?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted/50 p-4 rounded-full mb-4">
        <Search className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
      {suggestion && (
        <p className="text-xs text-muted-foreground mt-1">{suggestion}</p>
      )}
    </div>
  );
}
