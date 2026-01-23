"use client";

import { useState, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  ArrowRightCircle,
  SlidersHorizontal,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

// Filter state interface
export interface FilterState {
  relationships: {
    supports: boolean;
    contradicts: boolean;
    extends: boolean;
  };
  citationRange: [number, number];
  yearRange: [number, number];
}

interface GlobalFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  hiddenEdgeCount?: number;
  open: boolean;
  onToggle: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  relationships: {
    supports: true,
    contradicts: true,
    extends: true,
  },
  citationRange: [0, 1000],
  yearRange: [2019, 2026],
};

export function GlobalFilters({
  filters,
  onFiltersChange,
  hiddenEdgeCount = 0,
  open,
  onToggle,
}: GlobalFiltersProps) {
  const handleRelationshipToggle = useCallback(
    (type: keyof FilterState["relationships"]) => {
      onFiltersChange({
        ...filters,
        relationships: {
          ...filters.relationships,
          [type]: !filters.relationships[type],
        },
      });
    },
    [filters, onFiltersChange],
  );

  const handleCitationChange = useCallback(
    (value: number[]) => {
      onFiltersChange({
        ...filters,
        citationRange: [value[0], value[1]] as [number, number],
      });
    },
    [filters, onFiltersChange],
  );

  const handleYearChange = useCallback(
    (value: number[]) => {
      onFiltersChange({
        ...filters,
        yearRange: [value[0], value[1]] as [number, number],
      });
    },
    [filters, onFiltersChange],
  );

  const resetFilters = useCallback(() => {
    onFiltersChange(DEFAULT_FILTERS);
  }, [onFiltersChange]);

  // Count active filters
  const activeFilterCount =
    (filters.relationships.supports ? 0 : 1) +
    (filters.relationships.contradicts ? 0 : 1) +
    (filters.relationships.extends ? 0 : 1) +
    (filters.citationRange[0] > 0 || filters.citationRange[1] < 1000 ? 1 : 0) +
    (filters.yearRange[0] > 2019 || filters.yearRange[1] < 2026 ? 1 : 0);

  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg hover:bg-muted transition-colors"
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="text-sm font-medium">Filters</span>
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {activeFilterCount}
          </Badge>
        )}
      </button>
    );
  }

  return (
    <div className="absolute top-4 left-4 z-30 w-72 bg-card/95 backdrop-blur border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-left-2 fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div>
          <h3 className="font-bold text-sm">Global Filters</h3>
          <p className="text-xs text-muted-foreground">
            Configure graph visibility
          </p>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Relationship Types */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Relationship Types
          </h4>
          <div className="space-y-2">
            <FilterToggle
              icon={CheckCircle}
              label="Supports"
              color="text-supports"
              checked={filters.relationships.supports}
              onCheckedChange={() => handleRelationshipToggle("supports")}
            />
            <FilterToggle
              icon={XCircle}
              label="Refutes"
              color="text-contradicts"
              checked={filters.relationships.contradicts}
              onCheckedChange={() => handleRelationshipToggle("contradicts")}
            />
            <FilterToggle
              icon={ArrowRightCircle}
              label="Extends"
              color="text-extends"
              checked={filters.relationships.extends}
              onCheckedChange={() => handleRelationshipToggle("extends")}
            />
          </div>

          {/* Hidden edges indicator */}
          {hiddenEdgeCount > 0 && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <EyeOff className="h-3 w-3" />
              Hiding {hiddenEdgeCount} edges
            </p>
          )}
        </div>

        {/* Node Metrics */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Node Metrics
          </h4>
          <div className="space-y-4">
            {/* Citation Count */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Citation Count</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {filters.citationRange[0]}–{filters.citationRange[1]}
                </span>
              </div>
              <Slider
                value={[filters.citationRange[0], filters.citationRange[1]]}
                onValueChange={handleCitationChange}
                min={0}
                max={1000}
                step={10}
                className="w-full"
              />
            </div>

            {/* Publication Year */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Publication Year</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {filters.yearRange[0]}–{filters.yearRange[1]}
                </span>
              </div>
              <Slider
                value={[filters.yearRange[0], filters.yearRange[1]]}
                onValueChange={handleYearChange}
                min={2019}
                max={2026}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {activeFilterCount > 0 && (
        <div className="p-3 border-t border-border bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="w-full text-xs"
          >
            Reset all filters
          </Button>
        </div>
      )}
    </div>
  );
}

// Filter Toggle Component
function FilterToggle({
  icon: Icon,
  label,
  color,
  checked,
  onCheckedChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
        checked
          ? "bg-muted/50 border-border"
          : "bg-muted/20 border-transparent opacity-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${checked ? color : "text-muted-foreground"}`}
        />
        <span
          className={`text-sm font-medium ${checked ? "" : "text-muted-foreground"}`}
        >
          {label}
        </span>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// Graph Legend Component
export function GraphLegend() {
  return (
    <div className="absolute bottom-16 left-4 z-30 bg-card/90 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Legend
      </h4>
      <div className="space-y-1.5">
        <LegendItem color="bg-supports" label="Supports" dashed={false} />
        <LegendItem color="bg-contradicts" label="Refutes" dashed={true} />
        <LegendItem color="bg-extends" label="Extends" dashed={false} />
        <div className="flex items-center gap-2 pt-1">
          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/50" />
          <span className="text-xs text-muted-foreground">Citation Node</span>
        </div>
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-4 h-0.5 ${color} ${dashed ? "border-dashed border-t-2 border-contradicts bg-transparent" : ""}`}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export { DEFAULT_FILTERS };
