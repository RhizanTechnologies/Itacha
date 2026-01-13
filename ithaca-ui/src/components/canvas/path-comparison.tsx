"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GitCompare,
  ChevronRight,
  CheckCircle,
  XCircle,
  ArrowRightCircle,
  Maximize2,
  X,
  Plus,
  Eye,
} from "lucide-react";

// Types
interface PathNode {
  id: string;
  title: string;
  year: number;
  authors: string;
}

interface PathEdge {
  type: "supports" | "contradicts" | "extends";
  confidence: number;
}

interface ArgumentPath {
  id: string;
  name: string;
  nodes: PathNode[];
  edges: PathEdge[];
  color: string;
}

// Mock paths
const MOCK_PATHS: ArgumentPath[] = [
  {
    id: "path1",
    name: "Path A",
    color: "#3b82f6",
    nodes: [
      { id: "1", title: "Attention Is All You Need", year: 2017, authors: "Vaswani et al." },
      { id: "2", title: "BERT: Pre-training", year: 2018, authors: "Devlin et al." },
      { id: "3", title: "GPT-3: Language Models", year: 2020, authors: "Brown et al." },
      { id: "4", title: "InstructGPT", year: 2022, authors: "Ouyang et al." },
    ],
    edges: [
      { type: "supports", confidence: 95 },
      { type: "extends", confidence: 88 },
      { type: "supports", confidence: 92 },
    ],
  },
  {
    id: "path2",
    name: "Path B",
    color: "#ec4899",
    nodes: [
      { id: "1", title: "Attention Is All You Need", year: 2017, authors: "Vaswani et al." },
      { id: "5", title: "Transformer-XL", year: 2019, authors: "Dai et al." },
      { id: "6", title: "XLNet: Pre-training", year: 2019, authors: "Yang et al." },
      { id: "4", title: "InstructGPT", year: 2022, authors: "Ouyang et al." },
    ],
    edges: [
      { type: "extends", confidence: 90 },
      { type: "supports", confidence: 85 },
      { type: "extends", confidence: 78 },
    ],
  },
];

const EDGE_CONFIG = {
  supports: { icon: CheckCircle, color: "text-supports", bg: "bg-supports/10" },
  contradicts: { icon: XCircle, color: "text-contradicts", bg: "bg-contradicts/10" },
  extends: { icon: ArrowRightCircle, color: "text-extends", bg: "bg-extends/10" },
};

interface PathComparisonViewProps {
  isOpen: boolean;
  onClose: () => void;
  paths?: ArgumentPath[];
}

export function PathComparisonView({
  isOpen,
  onClose,
  paths = MOCK_PATHS,
}: PathComparisonViewProps) {
  const [selectedPaths, setSelectedPaths] = useState<string[]>(
    paths.slice(0, 2).map((p) => p.id)
  );
  const [highlightCommon, setHighlightCommon] = useState(true);

  if (!isOpen) return null;

  const activePaths = paths.filter((p) => selectedPaths.includes(p.id));
  
  // Find common nodes
  const commonNodeIds = activePaths.length >= 2
    ? activePaths[0].nodes
        .filter((n) => activePaths[1].nodes.some((n2) => n2.id === n.id))
        .map((n) => n.id)
    : [];

  const togglePath = (pathId: string) => {
    if (selectedPaths.includes(pathId)) {
      if (selectedPaths.length > 1) {
        setSelectedPaths(selectedPaths.filter((id) => id !== pathId));
      }
    } else if (selectedPaths.length < 2) {
      setSelectedPaths([...selectedPaths, pathId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GitCompare className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Path Comparison</h1>
                <p className="text-sm text-muted-foreground">
                  Compare argument paths side by side
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={highlightCommon ? "default" : "outline"}
                size="sm"
                onClick={() => setHighlightCommon(!highlightCommon)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Highlight Common
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Path Selector */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Comparing:</span>
            {paths.map((path) => (
              <Button
                key={path.id}
                variant={selectedPaths.includes(path.id) ? "default" : "outline"}
                size="sm"
                onClick={() => togglePath(path.id)}
                style={{
                  backgroundColor: selectedPaths.includes(path.id)
                    ? path.color
                    : undefined,
                  borderColor: path.color,
                }}
              >
                {path.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{commonNodeIds.length}</p>
                <p className="text-sm text-muted-foreground">Shared nodes</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {activePaths.reduce((sum, p) => sum + p.nodes.length, 0) - commonNodeIds.length * (activePaths.length - 1)}
                </p>
                <p className="text-sm text-muted-foreground">Unique nodes</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.max(...activePaths.map((p) => p.nodes.length))}
                </p>
                <p className="text-sm text-muted-foreground">Max path length</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side by Side Paths */}
        <div className={`grid gap-6`} style={{ gridTemplateColumns: `repeat(${activePaths.length}, 1fr)` }}>
          {activePaths.map((path) => (
            <Card key={path.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: path.color }}
                  />
                  {path.name}
                  <Badge variant="secondary" className="ml-auto">
                    {path.nodes.length} nodes
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {path.nodes.map((node, idx) => {
                    const isCommon = commonNodeIds.includes(node.id);
                    const edge = path.edges[idx];
                    const EdgeIcon = edge ? EDGE_CONFIG[edge.type].icon : null;

                    return (
                      <div key={node.id}>
                        {/* Node */}
                        <div
                          className={`p-3 rounded-lg border transition-all ${
                            isCommon && highlightCommon
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "bg-muted/50"
                          }`}
                        >
                          <h4 className="font-medium text-sm line-clamp-1">
                            {node.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {node.authors} • {node.year}
                          </p>
                          {isCommon && highlightCommon && (
                            <Badge className="mt-2 text-[10px]" variant="outline">
                              Shared
                            </Badge>
                          )}
                        </div>

                        {/* Edge */}
                        {edge && (
                          <div className="flex items-center justify-center py-2">
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                EDGE_CONFIG[edge.type].bg
                              } ${EDGE_CONFIG[edge.type].color}`}
                            >
                              {EdgeIcon && <EdgeIcon className="h-3 w-3" />}
                              <span className="capitalize">{edge.type}</span>
                              <span className="text-muted-foreground">
                                ({edge.confidence}%)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact trigger button for canvas
export function PathComparisonButton({
  onClick,
  pathCount = 2,
}: {
  onClick: () => void;
  pathCount?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="absolute top-28 right-4 z-30 flex items-center gap-2 px-3 py-2 rounded-lg bg-card/90 backdrop-blur border border-border shadow-lg hover:bg-muted transition-colors"
    >
      <GitCompare className="h-4 w-4" />
      <span className="text-sm font-medium">Compare Paths</span>
      {pathCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          {pathCount}
        </Badge>
      )}
    </button>
  );
}
