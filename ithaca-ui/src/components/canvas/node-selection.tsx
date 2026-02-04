"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MousePointer,
  X,
  Download,
  ZoomIn,
  Eye,
  GitCompare,
} from "lucide-react";

interface NodeSelectionToolProps {
  isActive: boolean;
  onToggle: () => void;
  selectedNodes: string[];
  onClearSelection: () => void;
  onRemoveNode: (nodeId: string) => void;
  onFocusSelection: () => void;
  onCompare: () => void;
  onExport: () => void;
  nodeLabels?: Record<string, string>; // Map of nodeId to label
}

interface SelectionPanelProps {
  selectedNodes: string[];
  nodeLabels: Record<string, string>;
  onClearSelection: () => void;
  onRemoveNode: (nodeId: string) => void;
  onFocusSelection: () => void;
  onCompare: () => void;
  onExport: () => void;
}

interface SelectionInstructionProps {
  isActive: boolean;
  hasSelection: boolean;
}

/**
 * NodeSelectionTool - Simple click-to-select for multiple nodes
 * When active, clicking nodes in the graph adds them to selection
 * Used for path comparison and batch operations
 */
/**
 * NodeSelectionToggle - The toggle button for selection mode
 */
export function NodeSelectionTool({
  isActive,
  onToggle,
  selectedNodes,
  nodeLabels = {},
}: Pick<
  NodeSelectionToolProps,
  "isActive" | "onToggle" | "selectedNodes" | "nodeLabels"
>) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg transition-all ${
        isActive
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card/90 backdrop-blur border-border hover:bg-muted"
      }`}
    >
      <MousePointer className="h-4 w-4" />
      <span className="text-sm font-medium hidden md:inline">
        {isActive ? "Selecting..." : "Select Nodes"}
      </span>
      {selectedNodes.length > 0 && (
        <Badge variant={isActive ? "secondary" : "default"} className="text-xs">
          {selectedNodes.length}
        </Badge>
      )}
    </button>
  );
}

/**
 * SelectionPanel - Shows selected nodes with actions
 */
export function SelectionPanel({
  selectedNodes,
  nodeLabels,
  onClearSelection,
  onRemoveNode,
  onFocusSelection,
  onCompare,
  onExport,
}: SelectionPanelProps) {
  if (selectedNodes.length === 0) return null;

  return (
    <div className="bg-card/95 backdrop-blur border border-border rounded-xl shadow-2xl p-4 min-w-80 max-w-md animate-in slide-in-from-bottom-4 fade-in">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-sm">Selected Nodes</h3>
          <p className="text-xs text-muted-foreground">
            {selectedNodes.length} node
            {selectedNodes.length !== 1 ? "s" : ""} selected
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClearSelection}
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected Node Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4 max-h-24 overflow-y-auto">
        {selectedNodes.map((nodeId) => (
          <Badge
            key={nodeId}
            variant="secondary"
            className="text-xs pr-1 flex items-center gap-1"
          >
            <span className="truncate max-w-32">
              {nodeLabels[nodeId] || nodeId}
            </span>
            <button
              onClick={() => onRemoveNode(nodeId)}
              className="ml-1 hover:bg-muted rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-col h-auto py-2 gap-1"
          onClick={onFocusSelection}
        >
          <ZoomIn className="h-4 w-4" />
          <span className="text-[10px]">Focus</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-col h-auto py-2 gap-1"
          onClick={onCompare}
          disabled={selectedNodes.length < 2}
        >
          <GitCompare className="h-4 w-4" />
          <span className="text-[10px]">Compare</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-col h-auto py-2 gap-1"
          onClick={onExport}
        >
          <Download className="h-4 w-4" />
          <span className="text-[10px]">Export</span>
        </Button>
      </div>
    </div>
  );
}

/**
 * SelectionInstruction - Shows instruction when selection mode is active
 */
export function SelectionInstruction({
  isActive,
  hasSelection,
}: SelectionInstructionProps) {
  if (!isActive || hasSelection) return null;

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-in fade-in">
      <div className="flex items-center gap-2 text-sm">
        <MousePointer className="h-4 w-4" />
        <span>Click nodes to select them</span>
      </div>
    </div>
  );
}
