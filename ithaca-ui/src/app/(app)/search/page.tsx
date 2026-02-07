"use client";

import { useState, useEffect } from "react";
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

interface SearchPageProps {
  initialQuery?: string;
}

export default function SearchPage({ initialQuery = "" }: SearchPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "year">("relevance");
  const [filterYear, setFilterYear] = useState<string>("all");

  // Search on query change (debounced)
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
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "year") return b.year - a.year;
    return 0; // Default order from API
  });

  // Filter by year
  const filteredResults = filterYear === "all" 
    ? sortedResults 
    : sortedResults.filter((r) => r.year >= parseInt(filterYear));

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

          {/* Filters & Sort */}
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
                    <SelectItem value="2024">2024+</SelectItem>
                    <SelectItem value="2023">2023+</SelectItem>
                    <SelectItem value="2022">2022+</SelectItem>
                    <SelectItem value="2020">2020+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                <ArrowUpDown className="h-4 w-4" />
                <span>Sort:</span>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
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
            <p className="text-muted-foreground">Searching...</p>
          </div>
        ) : hasSearched && filteredResults.length === 0 ? (
          <EmptyState query={query} />
        ) : hasSearched ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Found {filteredResults.length} results for "{query}"
            </p>
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <SearchResultCard key={result.id} result={result} query={query} />
              ))}
            </div>
          </>
        ) : (
          <SearchSuggestions />
        )}
      </div>
    </div>
  );
}

// Search Result Card
function SearchResultCard({ 
  result, 
  query 
}: { 
  result: SearchResult; 
  query: string;
}) {
  // Highlight matching text
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
      )
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
        <Button size="sm" variant="outline" className="text-xs">
          <FileText className="h-3 w-3 mr-1" />
          View Paper
        </Button>
        <Button size="sm" variant="outline" className="text-xs">
          <BookOpen className="h-3 w-3 mr-1" />
          Add to Collection
        </Button>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Search className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <h2 className="text-xl font-bold mb-2">No results found</h2>
      <p className="text-muted-foreground max-w-md">
        We couldn't find any papers matching "{query}". Try adjusting your search terms or browse popular topics.
      </p>
      <div className="flex gap-2 mt-6">
        <Button variant="outline" size="sm">
          Browse Topics
        </Button>
        <Button variant="outline" size="sm">
          View Recent Papers
        </Button>
      </div>
    </div>
  );
}

// Search Suggestions (Initial State)
function SearchSuggestions() {
  const suggestions = [
    "transformer architecture",
    "graph neural networks",
    "federated learning",
    "protein folding",
    "climate modeling",
  ];

  const recentSearches = [
    "attention mechanisms",
    "BERT applications",
    "reinforcement learning",
  ];

  return (
    <div className="py-10">
      {/* Recent Searches */}
      <div className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Recent Searches
        </h3>
        <div className="flex flex-wrap gap-2">
          {recentSearches.map((term) => (
            <Badge
              key={term}
              variant="secondary"
              className="cursor-pointer hover:bg-muted transition-colors"
            >
              {term}
            </Badge>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Trending Topics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {suggestions.map((term) => (
            <button
              key={term}
              className="p-3 rounded-lg border bg-card hover:bg-muted transition-colors text-left"
            >
              <span className="text-sm font-medium">{term}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
