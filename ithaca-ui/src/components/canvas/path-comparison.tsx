"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitCompare,
  ChevronRight,
  CheckCircle,
  XCircle,
  ArrowRightCircle,
  Eye,
} from "lucide-react";

import { useEffect } from "react";

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

// Generate paths from real graph data
export function generatePathsFromGraph(
  nodesData: Array<{
    id: string;
    title: string;
    year: number;
    authors: string;
  }>,
  edgesData: Array<{
    source: string;
    target: string;
    edgeType: string;
    confidence: number;
  }>,
): ArgumentPath[] {
  // Create sample paths from the first few connected nodes
  const paths: ArgumentPath[] = [];

  if (nodesData.length < 4) return paths;

  // Create Path A from first 4 nodes
  const pathANodes = nodesData.slice(0, 4);
  const pathAEdges = edgesData.slice(0, 3).map((e) => ({
    type: e.edgeType as "supports" | "contradicts" | "extends",
    confidence: e.confidence,
  }));

  paths.push({
    id: "path1",
    name: "Path A",
    color: "#3b82f6",
    nodes: pathANodes,
    edges: pathAEdges,
  });

  // Create Path B from different nodes if available
  if (nodesData.length >= 8) {
    const pathBNodes = nodesData.slice(4, 8);
    const pathBEdges = edgesData.slice(3, 6).map((e) => ({
      type: e.edgeType as "supports" | "contradicts" | "extends",
      confidence: e.confidence,
    }));

    paths.push({
      id: "path2",
      name: "Path B",
      color: "#ec4899",
      nodes: pathBNodes,
      edges: pathBEdges,
    });
  }

  return paths;
}

const EDGE_CONFIG = {
  supports: { icon: CheckCircle, color: "text-supports", bg: "bg-supports/10" },
  contradicts: {
    icon: XCircle,
    color: "text-contradicts",
    bg: "bg-contradicts/10",
  },
  extends: {
    icon: ArrowRightCircle,
    color: "text-extends",
    bg: "bg-extends/10",
  },
};

interface PathComparisonViewProps {
  isOpen: boolean;
  onClose: () => void;
  paths?: ArgumentPath[];
}

export function PathComparisonView({
  isOpen,
  onClose,
  paths = [],
}: PathComparisonViewProps) {
  const [selectedPaths, setSelectedPaths] = useState<string[]>(
    paths.slice(0, 2).map((p) => p.id),
  );

  // Sync selected paths when paths prop changes
  useEffect(() => {
    if (paths.length > 0) {
      setSelectedPaths(paths.slice(0, 2).map((p) => p.id));
    }
  }, [paths]);

  const [highlightCommon, setHighlightCommon] = useState(true);

  const activePaths = paths.filter((p) => selectedPaths.includes(p.id));

  // Find common nodes
  const commonNodeIds =
    activePaths.length >= 2
      ? activePaths[0]?.nodes
          ?.filter((n) => activePaths[1]?.nodes?.some((n2) => n2.id === n.id))
          ?.map((n) => n.id) || []
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
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            <SheetTitle>Path Comparison</SheetTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Compare argument paths side by side
          </p>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* No paths message */}
          {paths.length === 0 && (
            <div className="text-center py-12">
              <GitCompare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                No paths available to compare.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Select nodes in the graph to create comparison paths.
              </p>
            </div>
          )}

          {/* Path Selector */}
          {paths.length > 0 && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  Comparing:
                </span>
                {paths.map((path) => (
                  <Button
                    key={path.id}
                    variant={
                      selectedPaths.includes(path.id) ? "default" : "outline"
                    }
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

              <Button
                variant={highlightCommon ? "secondary" : "outline"}
                size="sm"
                onClick={() => setHighlightCommon(!highlightCommon)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Highlight Common
              </Button>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 text-center p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-xl font-bold">{commonNodeIds.length}</p>
                  <p className="text-xs text-muted-foreground">Shared</p>
                </div>
                <div>
                  <p className="text-xl font-bold">
                    {activePaths.reduce(
                      (sum, p) => sum + (p.nodes?.length || 0),
                      0,
                    ) -
                      commonNodeIds.length * (activePaths.length - 1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Unique</p>
                </div>
                <div>
                  <p className="text-xl font-bold">
                    {Math.max(
                      ...activePaths.map((p) => p.nodes?.length || 0),
                      0,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Max Length</p>
                </div>
              </div>

              {/* Paths */}
              <div className="space-y-6">
                {activePaths.map((path) => (
                  <div key={path.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: path.color }}
                      />
                      <span className="font-medium">{path.name}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {path.nodes?.length || 0} nodes
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {path.nodes?.map((node, idx) => {
                        const isCommon = commonNodeIds.includes(node.id);
                        const edge = path.edges?.[idx];
                        const EdgeIcon = edge
                          ? EDGE_CONFIG[edge.type]?.icon
                          : null;

                        return (
                          <div key={node.id}>
                            {/* Node */}
                            <div
                              className={`p-3 rounded-lg border transition-all ${
                                isCommon && highlightCommon
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
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
                                <Badge
                                  className="mt-2 text-[10px]"
                                  variant="outline"
                                >
                                  Shared
                                </Badge>
                              )}
                            </div>

                            {/* Edge */}
                            {edge && (
                              <div className="flex items-center justify-center py-2">
                                <div
                                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                    EDGE_CONFIG[edge.type]?.bg || ""
                                  } ${EDGE_CONFIG[edge.type]?.color || ""}`}
                                >
                                  {EdgeIcon && <EdgeIcon className="h-3 w-3" />}
                                  <span className="capitalize">
                                    {edge.type}
                                  </span>
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
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Compact trigger button for canvas
export function PathComparisonButton({
  onClick,
  pathCount = 0,
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
