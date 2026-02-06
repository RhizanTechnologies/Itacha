"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  FileText,
  Search,
  History,
  Zap,
  Network,
  Download,
  Settings,
  Keyboard,
  Filter,
  Moon,
  Sun,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { graphAPI, SearchResult } from "@/lib/api/graph-api";

interface CommandBarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelectPaper?: (paperId: string) => void;
  onAction?: (action: string) => void;
  hideTrigger?: boolean;
}

export function CommandBar({
  open: controlledOpen,
  onOpenChange,
  onSelectPaper,
  onAction,
  hideTrigger = false,
}: CommandBarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentPapers, setRecentPapers] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { theme, setTheme } = useTheme();

  // Listen for keyboard shortcut and external open events
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    const openEvent = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("open-command-bar", openEvent);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-bar", openEvent);
    };
  }, [open, setOpen]);

  // Load recent papers on mount
  useEffect(() => {
    async function loadRecent() {
      try {
        const results = await graphAPI.searchPapers("");
        setRecentPapers(results.slice(0, 3));
      } catch {
        // Recent papers are non-critical
      }
    }
    loadRecent();
  }, []);

  // Search papers when query changes
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await graphAPI.searchPapers(search);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce

    return () => clearTimeout(searchTimeout);
  }, [search]);

  const handleSelectPaper = useCallback(
    (paperId: string) => {
      onSelectPaper?.(paperId);
      setOpen(false);
      setSearch("");
    },
    [onSelectPaper],
  );

  const handleAction = useCallback(
    (action: string) => {
      onAction?.(action);
      setOpen(false);
    },
    [onAction],
  );

  return (
    <>
      {/* Trigger Button */}
      {!hideTrigger && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 bg-background/95 backdrop-blur-sm border border-border/50 rounded-full shadow-lg hover:bg-muted/80 transition-all hover:scale-[1.02] active:scale-95 group w-full max-w-sm justify-between md:justify-start md:w-auto"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Search papers, actions...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex h-5 px-1.5 items-center gap-0.5 rounded border border-border bg-muted/50 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      )}

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search papers, authors, or actions..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            {isSearching ? (
              <div className="py-6 text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50 animate-spin" />
                <p className="text-sm text-muted-foreground">Searching...</p>
              </div>
            ) : (
              <div className="py-6 text-center">
                <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No results found.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching for a paper title or author
                </p>
              </div>
            )}
          </CommandEmpty>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <CommandGroup heading="Search Results">
              {searchResults.map((paper) => (
                <CommandItem
                  key={paper.id}
                  value={paper.title}
                  onSelect={() => handleSelectPaper(paper.id)}
                  className="py-3 cursor-pointer"
                >
                  <FileText className="mr-3 h-5 w-5 text-muted-foreground/70" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium heading-text">
                      {paper.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {paper.authors} • {paper.year}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Recent Papers (when no search) */}
          {!search && recentPapers.length > 0 && (
            <CommandGroup heading="Recent Papers">
              {recentPapers.map((paper) => (
                <CommandItem
                  key={paper.id}
                  value={paper.title}
                  onSelect={() => handleSelectPaper(paper.id)}
                  className="py-3 cursor-pointer"
                >
                  <History className="mr-3 h-5 w-5 text-muted-foreground/70" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium heading-text">
                      {paper.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {paper.authors} • {paper.year}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Quick Actions */}
          <CommandGroup heading="Quick Actions" className="pt-2">
            <CommandItem
              onSelect={() => handleAction("toggle-physics")}
              className="py-2.5"
            >
              <Zap className="mr-2 h-4 w-4 text-yellow-500/80" />
              <span>Toggle Physics Simulation</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleAction("reset-view")}>
              <Network className="mr-2 h-4 w-4" />
              <span>Reset Graph View</span>
              <CommandShortcut>⌘R</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleAction("open-filters")}>
              <Filter className="mr-2 h-4 w-4" />
              <span>Open Filters</span>
              <CommandShortcut>⌘F</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleAction("export")}>
              <Download className="mr-2 h-4 w-4" />
              <span>Export Graph</span>
              <CommandShortcut>⌘E</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Settings */}
          <CommandGroup heading="Settings">
            <CommandItem
              onSelect={() => {
                setTheme(theme === "dark" ? "light" : "dark");
                setOpen(false);
              }}
            >
              {theme === "dark" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              <span>Toggle Theme</span>
              <CommandShortcut>⌘T</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleAction("shortcuts")}>
              <Keyboard className="mr-2 h-4 w-4" />
              <span>Keyboard Shortcuts</span>
              <CommandShortcut>?</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleAction("settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
