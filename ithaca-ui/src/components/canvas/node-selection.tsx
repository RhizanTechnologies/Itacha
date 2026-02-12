"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MousePointer,
  X,
  Download,
  ZoomIn,
  GitCompare,
  ArrowRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NodeSelectionToolProps {
  isActive: boolean;
  onToggle: () => void;
  selectedNodes: string[];
  onClearSelection: () => void;
  onRemoveNode: (nodeId: string) => void;
  onFocusSelection: () => void;
  onCompare: () => void;
  onExport: (format: "csv" | "bibtex") => void;
  nodeLabels?: Record<string, string>;
}

interface SelectionPanelProps {
  selectedNodes: string[];
  nodeLabels: Record<string, string>;
  onClearSelection: () => void;
  onRemoveNode: (nodeId: string) => void;
  onFocusSelection: () => void;
  onCompare: () => void;
  onExport: (format: "csv" | "bibtex") => void;
}

interface SelectionInstructionProps {
  isActive: boolean;
  selectedCount: number;
}

/**
 * NodeSelectionTool - Toggle button for selection mode (top-right)
 */
export function NodeSelectionTool({
  isActive,
  onToggle,
  selectedNodes,
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
          {selectedNodes.length}/2
        </Badge>
      )}
    </button>
  );
}

/**
 * NodeSlot - Renders a single Source or Target slot
 */
function NodeSlot({
  role,
  nodeId,
  label,
  onRemove,
}: {
  role: "Source" | "Target";
  nodeId: string | null;
  label: string | null;
  onRemove?: () => void;
}) {
  const isSource = role === "Source";

  if (!nodeId) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/60 bg-muted/20 min-w-0">
        <div className={`h-3 w-3 rounded-full border-2 ${isSource ? "border-emerald-500/40" : "border-blue-500/40"}`} />
        <span className="text-xs text-muted-foreground">
          Click a node to set {role.toLowerCase()}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border min-w-0 ${
      isSource ? "border-emerald-500/40 bg-emerald-500/5" : "border-blue-500/40 bg-blue-500/5"
    }`}>
      <div className={`h-3 w-3 rounded-full shrink-0 ${isSource ? "bg-emerald-500" : "bg-blue-500"}`} />
      <div className="min-w-0 flex-1">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isSource ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}>
          {role}
        </span>
        <p className="text-xs font-medium truncate">{label || nodeId}</p>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

/**
 * SelectionPanel - Bottom bar with Source → Target slots and actions
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

  const sourceId = selectedNodes[0] || null;
  const targetId = selectedNodes[1] || null;

  return (
    <div className="bg-card/95 backdrop-blur border border-border rounded-xl shadow-2xl p-4 w-[90vw] md:w-auto md:min-w-96 max-w-lg animate-in slide-in-from-bottom-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm">Find Path</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClearSelection}
          title="Clear selection"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Source → Target slots */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <NodeSlot
            role="Source"
            nodeId={sourceId}
            label={sourceId ? nodeLabels[sourceId] || null : null}
            onRemove={sourceId ? () => onRemoveNode(sourceId) : undefined}
          />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <NodeSlot
            role="Target"
            nodeId={targetId}
            label={targetId ? nodeLabels[targetId] || null : null}
            onRemove={targetId ? () => onRemoveNode(targetId) : undefined}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          className="flex-1 gap-2"
          size="sm"
          onClick={onCompare}
          disabled={selectedNodes.length < 2}
        >
          <GitCompare className="h-3.5 w-3.5" />
          Find Path
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={onFocusSelection}
          title="Focus on selected nodes"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1" title="Export selected">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport("csv")}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("bibtex")}>
              Export as BibTeX
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/**
 * SelectionInstruction - Shows guidance when selection mode is active
 */
export function SelectionInstruction({
  isActive,
  selectedCount,
}: SelectionInstructionProps) {
  if (!isActive) return null;

  const message =
    selectedCount === 0
      ? "Click a node to set the source"
      : selectedCount === 1
        ? "Click another node to set the target"
        : "Ready to find path — or click a node to replace target";

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-in fade-in">
      <div className="flex items-center gap-2 text-sm">
        <MousePointer className="h-4 w-4" />
        <span>{message}</span>
      </div>
    </div>
  );
}
