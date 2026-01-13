"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Search,
  Download,
  Save,
  History,
  Sparkles,
  GripVertical,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Types
type Operator = "AND" | "OR" | "NOT";
type Field = "title" | "author" | "abstract" | "year" | "venue" | "keywords";
type Comparator = "contains" | "equals" | "starts_with" | "range";

interface QueryCondition {
  id: string;
  field: Field;
  comparator: Comparator;
  value: string;
  value2?: string; // For range queries
  operator?: Operator;
}

interface SavedQuery {
  id: string;
  name: string;
  conditions: QueryCondition[];
  createdAt: string;
}

const FIELDS: { value: Field; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "author", label: "Author" },
  { value: "abstract", label: "Abstract" },
  { value: "year", label: "Year" },
  { value: "venue", label: "Venue" },
  { value: "keywords", label: "Keywords" },
];

const COMPARATORS: { value: Comparator; label: string }[] = [
  { value: "contains", label: "contains" },
  { value: "equals", label: "equals" },
  { value: "starts_with", label: "starts with" },
  { value: "range", label: "in range" },
];

const SAVED_QUERIES: SavedQuery[] = [
  {
    id: "1",
    name: "Recent Transformer Papers",
    conditions: [
      { id: "1", field: "title", comparator: "contains", value: "transformer" },
      { id: "2", field: "year", comparator: "range", value: "2022", value2: "2024", operator: "AND" },
    ],
    createdAt: "2 days ago",
  },
  {
    id: "2",
    name: "NLP at Top Venues",
    conditions: [
      { id: "1", field: "keywords", comparator: "contains", value: "NLP" },
      { id: "2", field: "venue", comparator: "equals", value: "ACL", operator: "OR" },
      { id: "3", field: "venue", comparator: "equals", value: "EMNLP", operator: "OR" },
    ],
    createdAt: "1 week ago",
  },
];

export function QueryBuilder() {
  const [conditions, setConditions] = useState<QueryCondition[]>([
    { id: "1", field: "title", comparator: "contains", value: "" },
  ]);
  const [savedQueries] = useState<SavedQuery[]>(SAVED_QUERIES);

  const addCondition = () => {
    const newCondition: QueryCondition = {
      id: String(Date.now()),
      field: "title",
      comparator: "contains",
      value: "",
      operator: "AND",
    };
    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((c) => c.id !== id));
    }
  };

  const updateCondition = (id: string, updates: Partial<QueryCondition>) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const loadQuery = (query: SavedQuery) => {
    setConditions(query.conditions);
  };

  const buildQueryString = () => {
    return conditions
      .map((c, i) => {
        const prefix = i > 0 && c.operator ? `${c.operator} ` : "";
        if (c.comparator === "range") {
          return `${prefix}${c.field}:[${c.value} TO ${c.value2}]`;
        }
        return `${prefix}${c.field}:${c.comparator === "equals" ? '"' : ""}${c.value}${c.comparator === "equals" ? '"' : ""}`;
      })
      .join(" ");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-full pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Advanced Query Builder
          </h1>
          <p className="text-muted-foreground text-sm">
            Build complex search queries with multiple conditions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Save className="h-4 w-4" />
            Save Query
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Query Builder */}
        <div className="col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Query Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={condition.id} className="flex items-center gap-2">
                  {/* Drag Handle */}
                  <div className="cursor-grab text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  {/* Operator (for subsequent conditions) */}
                  {index > 0 && (
                    <Select
                      value={condition.operator}
                      onValueChange={(v) =>
                        updateCondition(condition.id, { operator: v as Operator })
                      }
                    >
                      <SelectTrigger className="w-20 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                        <SelectItem value="NOT">NOT</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* Field */}
                  <Select
                    value={condition.field}
                    onValueChange={(v) =>
                      updateCondition(condition.id, { field: v as Field })
                    }
                  >
                    <SelectTrigger className="w-28 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELDS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Comparator */}
                  <Select
                    value={condition.comparator}
                    onValueChange={(v) =>
                      updateCondition(condition.id, { comparator: v as Comparator })
                    }
                  >
                    <SelectTrigger className="w-32 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPARATORS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Value(s) */}
                  <Input
                    placeholder="Value..."
                    value={condition.value}
                    onChange={(e) =>
                      updateCondition(condition.id, { value: e.target.value })
                    }
                    className="flex-1 h-9"
                  />

                  {condition.comparator === "range" && (
                    <>
                      <span className="text-muted-foreground text-sm">to</span>
                      <Input
                        placeholder="Value..."
                        value={condition.value2 || ""}
                        onChange={(e) =>
                          updateCondition(condition.id, { value2: e.target.value })
                        }
                        className="w-24 h-9"
                      />
                    </>
                  )}

                  {/* Remove */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => removeCondition(condition.id)}
                    disabled={conditions.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addCondition}
                className="w-full gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Condition
              </Button>
            </CardContent>
          </Card>

          {/* Query Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Query Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-3 font-mono text-sm">
                {buildQueryString() || <span className="text-muted-foreground">Enter search conditions above</span>}
              </div>
              <Button className="w-full mt-4 gap-2">
                <Search className="h-4 w-4" />
                Execute Query
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Saved Queries Sidebar */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Saved Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {savedQueries.length > 0 ? (
                <div className="space-y-2">
                  {savedQueries.map((query) => (
                    <button
                      key={query.id}
                      onClick={() => loadQuery(query)}
                      className="w-full text-left p-3 rounded-lg border bg-background hover:bg-muted transition-colors"
                    >
                      <div className="font-medium text-sm">{query.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {query.conditions.length} conditions • {query.createdAt}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No saved queries yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function QueryBuilderPage() {
  return <QueryBuilder />;
}
