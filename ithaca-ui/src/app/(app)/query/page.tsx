"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QueryBuilder } from "@/components/query/query-builder";
import type { QueryCondition } from "@/components/query/query-builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { graphAPI, type SearchResult } from "@/lib/api/graph-api";

function conditionsToSearchQuery(conditions: QueryCondition[]): string {
  const textParts: string[] = [];

  for (const c of conditions) {
    if (
      c.field === "title" ||
      c.field === "abstract" ||
      c.field === "authors" ||
      c.field === "keywords"
    ) {
      if (typeof c.value === "string" && c.value.trim()) {
        textParts.push(c.value.trim());
      }
    }
  }

  return textParts.join(" ");
}

export default function QueryBuilderPage() {
  const router = useRouter();
  const [queryResults, setQueryResults] = useState<SearchResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecuteQuery = async (conditions: QueryCondition[]) => {
    const searchQuery = conditionsToSearchQuery(conditions);
    if (!searchQuery) {
      setError(
        "Add at least one text condition (title, abstract, authors, or keywords) to search.",
      );
      return;
    }

    setIsExecuting(true);
    setError(null);
    setHasExecuted(false);

    try {
      const results = await graphAPI.searchPapers(searchQuery);
      setQueryResults(results);
      setHasExecuted(true);
    } catch (e) {
      console.error("Query execution failed:", e);
      setError("Query execution failed. Please try again.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSaveQuery = (query: any) => {
    if (typeof window !== "undefined") {
      const key = "ithaca_saved_queries";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.unshift(query);
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 20)));
    }
  };

  const loadSavedQueries = () => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("ithaca_saved_queries") || "[]");
    } catch {
      return [];
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-96 border-r border-border">
        <QueryBuilder
          onExecuteQuery={handleExecuteQuery}
          onSaveQuery={handleSaveQuery}
          savedQueries={loadSavedQueries()}
        />
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Query Results</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          Build conditions on the left and execute to search papers via
          OpenAlex.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {isExecuting ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-muted-foreground">Searching OpenAlex...</p>
          </div>
        ) : hasExecuted && queryResults.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {queryResults.length} results
            </p>
            {queryResults.map((result) => (
              <div
                key={result.id}
                className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold">{result.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.authors} &bull; {result.year}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() =>
                      router.push(
                        `/explore?q=${encodeURIComponent(result.id)}`,
                      )
                    }
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View in Explorer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : hasExecuted ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No results found</p>
            <p className="text-sm mt-2">
              Try broadening your query conditions
            </p>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No results yet</p>
            <p className="text-sm mt-2">
              Add conditions and click Execute to search
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
