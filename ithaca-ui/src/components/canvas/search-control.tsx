"use client";

import { useState, useCallback, useEffect } from "react";
import { useSigma } from "@react-sigma/core";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchControl() {
  const sigma = useSigma();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Search nodes by label
  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const graph = sigma.getGraph();
    const matches: string[] = [];
    
    graph.forEachNode((node, attrs) => {
      const label = (attrs.label as string || "").toLowerCase();
      if (label.includes(searchQuery.toLowerCase())) {
        matches.push(node);
      }
    });

    setResults(matches.slice(0, 5)); // Limit to 5 results
  }, [sigma]);

  // Focus on a specific node
  const focusNode = useCallback((nodeId: string) => {
    const graph = sigma.getGraph();
    
    if (!graph.hasNode(nodeId)) return;

    const nodePosition = sigma.getNodeDisplayData(nodeId);
    if (!nodePosition) return;

    // Center camera on node
    sigma.getCamera().animate(
      { x: nodePosition.x, y: nodePosition.y, ratio: 0.5 },
      { duration: 500 }
    );

    // Highlight the node
    setSelectedNode(nodeId);
    setResults([]);
    setQuery("");

    // Dim other nodes, highlight selected
    graph.forEachNode((node) => {
      graph.setNodeAttribute(node, "highlighted", node === nodeId);
    });
  }, [sigma]);

  // Clear highlight when query changes
  useEffect(() => {
    if (!query && selectedNode) {
      const graph = sigma.getGraph();
      graph.forEachNode((node) => {
        graph.removeNodeAttribute(node, "highlighted");
      });
      setSelectedNode(null);
    }
  }, [query, selectedNode, sigma]);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    
    const graph = sigma.getGraph();
    graph.forEachNode((node) => {
      graph.removeNodeAttribute(node, "highlighted");
    });
    setSelectedNode(null);
  };

  return (
    <div className="absolute top-4 left-4 z-10 w-72">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search nodes..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9 pr-8 bg-background/90 backdrop-blur border-border shadow-lg"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {results.length > 0 && (
        <div className="mt-1 bg-background/95 backdrop-blur border border-border rounded-md shadow-lg overflow-hidden">
          {results.map((nodeId) => {
            const attrs = sigma.getGraph().getNodeAttributes(nodeId);
            return (
              <button
                key={nodeId}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                onClick={() => focusNode(nodeId)}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: attrs.color as string }}
                />
                <span className="truncate">{attrs.label as string}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {query && results.length === 0 && (
        <div className="mt-1 bg-background/95 backdrop-blur border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
          No nodes found matching "{query}"
        </div>
      )}
    </div>
  );
}
