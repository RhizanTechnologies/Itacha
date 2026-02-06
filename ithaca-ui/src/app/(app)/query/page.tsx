"use client";

import { useState } from "react";
import { QueryBuilder } from "@/components/query/query-builder";
import type { QueryCondition } from "@/components/query/query-builder";
import { Badge } from "@/components/ui/badge";

export default function QueryBuilderPage() {
  const [queryResults, setQueryResults] = useState<any[]>([]);

  const handleExecuteQuery = (conditions: QueryCondition[]) => {
    console.log("Executing query:", conditions);
    // TODO: Execute query against backend
    setQueryResults([]);
  };

  const handleSaveQuery = (query: any) => {
    console.log("Saving query:", query);
    // TODO: Save to backend
  };

  return (
    <>
      <div className="flex h-full">
        {/* Query Builder Sidebar */}
        <div className="w-96 border-r border-border">
          <QueryBuilder
            onExecuteQuery={handleExecuteQuery}
            onSaveQuery={handleSaveQuery}
            savedQueries={[]}
          />
        </div>

        {/* Results Area */}
        <div className="flex-1 p-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">Query Results</h1>
            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            Query execution is not yet connected to a backend. Build queries on the left to preview the interface.
          </p>

          {queryResults.length > 0 ? (
            <div className="space-y-4">
              {queryResults.map((result: any) => (
                <div
                  key={result.id}
                  className="p-4 border border-border rounded-lg"
                >
                  <h3 className="font-semibold">{result.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {result.authors}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No results yet</p>
              <p className="text-sm mt-2">Execute a query to see papers</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
