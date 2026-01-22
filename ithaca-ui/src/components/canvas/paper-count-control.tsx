"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, RefreshCw } from "lucide-react";

interface PaperCountControlProps {
  count: number;
  onChange: (count: number) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const PAPER_COUNT_OPTIONS = [5, 10, 25, 50, 100] as const;

/**
 * PaperCountControl - Allows user to select number of papers to display
 * Positioned at top-right to avoid overlap with filters panel
 */
export function PaperCountControl({
  count,
  onChange,
  onRefresh,
  isLoading = false,
}: PaperCountControlProps) {
  return (
    <div className="absolute top-16 left-4 z-30 flex items-center gap-2">
      <div className="flex items-center gap-2 bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-1.5 shadow-lg">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <Select
          value={String(count)}
          onValueChange={(value) => onChange(Number(value))}
        >
          <SelectTrigger className="w-24 h-7 text-xs border-0 bg-transparent p-0 focus:ring-0">
            <SelectValue placeholder="Papers" />
          </SelectTrigger>
          <SelectContent>
            {PAPER_COUNT_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} papers
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-6 w-6"
          title="Regenerate graph"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
    </div>
  );
}
