"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  FileText,
  Users,
  Calendar,
  Filter,
  ArrowUpDown,
  Loader2,
  BookOpen,
  Sparkles,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { graphAPI, SearchResult } from "@/lib/api/graph-api";
import { escapeRegex } from "@/lib/utils";

const RECENT_SEARCHES_KEY = "ithaca_recent_searches";
const MAX_RECENT = 8;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  if (typeof window === "undefined") return;
  const recent = getRecentSearches().filter((t) => t !== term);
  recent.unshift(term);
  localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT)),
  );
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "year">("relevance");
  const [filterYear, setFilterYear] = useState<string>("all");

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchResults = await graphAPI.searchPapers(query);
        setResults(searchResults);
        setHasSearched(true);
        saveRecentSearch(query.trim());
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "year") return b.year - a.year;
    return 0;
  });

  const filteredResults =
    filterYear === "all"
      ? sortedResults
      : sortedResults.filter((r) => r.year >= parseInt(filterYear));

  const handleViewPaper = useCallback(
    (paperId: string) => {
      router.push(`/explore?q=${encodeURIComponent(paperId)}`);
    },
    [router],
  );

  const handleSuggestionClick = useCallback((term: string) => {
    setQuery(term);
  }, []);

  return (
    <div className="min-h-full bg-muted/30 pb-10">
      {/* Search Header */}
      <div className="bg-card border-b sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search papers, authors, topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-12 h-12 text-lg"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {hasSearched && results.length > 0 && (
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Year:</span>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="2025">2025+</SelectItem>
                    <SelectItem value="2024">2024+</SelectItem>
                    <SelectItem value="2023">2023+</SelectItem>
                    <SelectItem value="2020">2020+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                <ArrowUpDown className="h-4 w-4" />
                <span>Sort:</span>
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as typeof sortBy)}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Searching OpenAlex...</p>
          </div>
        ) : hasSearched && filteredResults.length === 0 ? (
          <EmptyState query={query} onExplore={() => router.push("/explore")} />
        ) : hasSearched ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Found {filteredResults.length} results for &ldquo;{query}&rdquo;
            </p>
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <SearchResultCard
                  key={result.id}
                  result={result}
                  query={query}
                  onViewPaper={handleViewPaper}
                />
              ))}
            </div>
          </>
        ) : (
          <SearchSuggestions onSelect={handleSuggestionClick} />
        )}
      </div>
    </div>
  );
}

function SearchResultCard({
  result,
  query,
  onViewPaper,
}: {
  result: SearchResult;
  query: string;
  onViewPaper: (id: string) => void;
}) {
  const highlightMatch = (text: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary/20 text-primary px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-lg leading-tight">
          {highlightMatch(result.title)}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {highlightMatch(result.authors)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {result.year}
          </span>
          <Badge variant="secondary" className="text-xs">
            {result.type}
          </Badge>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => onViewPaper(result.id)}
        >
          <FileText className="h-3 w-3 mr-1" />
          View in Explorer
        </Button>
      </div>
    </div>
  );
}

function EmptyState({
  query,
  onExplore,
}: {
  query: string;
  onExplore: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Search className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <h2 className="text-xl font-bold mb-2">No results found</h2>
      <p className="text-muted-foreground max-w-md">
        We couldn&apos;t find any papers matching &ldquo;{query}&rdquo;. Try
        adjusting your search terms or explore a topic.
      </p>
      <Button variant="outline" size="sm" className="mt-6" onClick={onExplore}>
        Go to Explorer
      </Button>
    </div>
  );
}

function SearchSuggestions({ onSelect }: { onSelect: (term: string) => void }) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<SearchResult[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchTrending() {
      setLoadingTopics(true);
      try {
        const topics = await graphAPI.searchTopics("machine learning");
        if (!cancelled) setTrendingTopics(topics);
      } catch {
        // Silently fail — trending is optional
      } finally {
        if (!cancelled) setLoadingTopics(false);
      }
    }
    fetchTrending();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="py-10">
      {recentSearches.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <Badge
                key={term}
                variant="secondary"
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={() => onSelect(term)}
              >
                {term}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Explore Topics
        </h3>
        {loadingTopics ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading topics...
          </div>
        ) : trendingTopics.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {trendingTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onSelect(topic.title)}
                className="p-3 rounded-lg border bg-card hover:bg-muted transition-colors text-left"
              >
                <span className="text-sm font-medium">{topic.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              "transformer architecture",
              "graph neural networks",
              "protein folding",
              "climate modeling",
              "federated learning",
              "large language models",
            ].map((term) => (
              <button
                key={term}
                onClick={() => onSelect(term)}
                className="p-3 rounded-lg border bg-card hover:bg-muted transition-colors text-left"
              >
                <span className="text-sm font-medium">{term}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
