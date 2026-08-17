/**
 * Canvas Chat Panel - Split View Graph Exploration Assistant
 *
 * A resizable side panel that lives alongside the canvas (not overlay).
 * Similar to VS Code Copilot Chat - proper split view with drag handle.
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Send,
  Sparkles,
  X,
  Lightbulb,
  Network,
  TrendingUp,
  GripVertical,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface PaperSummary {
  title: string;
  authors: string;
  year: number;
  citations: number;
  supports: number;
  refutes: number;
}

interface CanvasChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  graphContext: {
    nodeCount: number;
    edgeCount: number;
    selectedNode?: string | null;
    focusedCluster?: string | null;
    papers?: PaperSummary[];
  };
  onNavigateToPaper?: (paperId: string) => void;
  onFocusNode?: (nodeId: string) => void;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

// =============================================================================
// QUICK ACTIONS
// =============================================================================

const QUICK_ACTIONS = [
  {
    icon: Lightbulb,
    label: "Most influential papers",
    query: "What are the most influential papers in this graph?",
  },
  {
    icon: Network,
    label: "Find connections",
    query: "Show me connections between selected papers",
  },
  {
    icon: TrendingUp,
    label: "Research trends",
    query: "What research trends do you see in this graph?",
  },
];

// =============================================================================
// RESIZE HANDLE COMPONENT
// =============================================================================

interface ResizeHandleProps {
  onResize: (delta: number) => void;
}

function ResizeHandle({ onResize }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startXRef.current - e.clientX;
      startXRef.current = e.clientX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onResize]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className={cn(
        "group absolute top-0 bottom-0 left-0 w-1 cursor-col-resize",
        "hover:bg-primary/50 transition-colors",
        isDragging && "bg-primary",
      )}
    >
      <div
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "opacity-0 transition-opacity group-hover:opacity-100",
          isDragging && "opacity-100",
        )}
      >
        <GripVertical className="text-muted-foreground h-6 w-6" />
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CanvasChatPanel({
  isOpen,
  onClose,
  graphContext,
  onNavigateToPaper,
  onFocusNode,
  defaultWidth = 380,
  minWidth = 300,
  maxWidth = 600,
}: CanvasChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [width, setWidth] = useState(defaultWidth);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle resize
  const handleResize = useCallback(
    (delta: number) => {
      setWidth((prev) => Math.min(maxWidth, Math.max(minWidth, prev + delta)));
    },
    [minWidth, maxWidth],
  );

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = text || input.trim();
      if (!messageText || isTyping) return;

      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: messageText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      try {
        // Build history from existing messages (excluding the one we just added)
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText,
            graphContext: {
              nodeCount: graphContext.nodeCount,
              edgeCount: graphContext.edgeCount,
              selectedNode: graphContext.selectedNode,
              focusedCluster: graphContext.focusedCluster,
              papers: graphContext.papers,
            },
            history,
          }),
        });

        if (!res.ok) {
          throw new Error(`Chat request failed (${res.status})`);
        }

        const data = await res.json();

        // Check if response indicates LLM fallback
        const responseContent =
          data.response ||
          data.fallback ||
          "I couldn't generate a response. Try rephrasing your question.";

        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: responseContent,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("[Chat] Error:", error);

        // Provide a useful fallback using local graph data
        const papers = graphContext.papers || [];
        let fallbackContent =
          "I'm having trouble connecting to the AI service. ";

        if (papers.length > 0) {
          const mostCited = [...papers]
            .sort((a, b) => b.citations - a.citations)
            .slice(0, 3);
          const contradicted = papers.filter((p) => p.refutes > 0);

          fallbackContent += `Here's what I can tell you from the graph data:\n\n`;
          fallbackContent += `**${graphContext.nodeCount} papers** with **${graphContext.edgeCount} citation links**\n\n`;
          fallbackContent += `**Most cited:**\n`;
          mostCited.forEach((p) => {
            fallbackContent += `- ${p.title} (${p.year}) — ${p.citations} citations\n`;
          });
          if (contradicted.length > 0) {
            fallbackContent += `\n**Papers with contradictions:** ${contradicted.length}`;
          }
        } else {
          fallbackContent += "Please try again in a moment.";
        }

        const errorMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: fallbackContent,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, graphContext, messages],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div
      className="border-border bg-background relative flex h-full flex-col border-l"
      style={{ width }}
    >
      {/* Resize Handle */}
      <ResizeHandle onResize={handleResize} />

      {/* Header */}
      <div className="border-border flex shrink-0 items-center justify-between border-b bg-gradient-to-r from-violet-500/5 to-transparent px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Graph Assistant</h3>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              <span className="text-muted-foreground text-[10px]">
                {graphContext.nodeCount} papers · {graphContext.edgeCount}{" "}
                citations
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-7 w-7"
              onClick={handleClearChat}
              title="Clear chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col p-4">
            {/* Welcome */}
            <div className="mb-6 pt-4 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20">
                <MessageSquare className="h-7 w-7 text-violet-500" />
              </div>
              <h4 className="mb-1 font-semibold">Explore this graph</h4>
              <p className="text-muted-foreground mx-auto max-w-[260px] text-xs">
                Ask questions about papers, find connections, or discover
                research insights
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-muted-foreground px-1 text-[10px] font-medium tracking-wider uppercase">
                Quick questions
              </p>
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(action.query)}
                  className="bg-muted/50 hover:bg-muted hover:border-border group flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-all"
                >
                  <div className="bg-background border-border group-hover:border-primary/30 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors">
                    <action.icon className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "flex-row-reverse",
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-md"
                      : "bg-muted rounded-tl-md",
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
                    <span className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
                    <span className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-border bg-background/50 shrink-0 border-t p-3">
        <div className="bg-muted/50 border-border focus-within:border-primary/50 focus-within:ring-primary/20 flex items-end gap-2 rounded-xl border transition-all focus-within:ring-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 100) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this graph..."
            rows={1}
            className="placeholder:text-muted-foreground/60 max-h-[100px] min-h-[44px] flex-1 resize-none bg-transparent px-4 py-3 text-sm focus:outline-none"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            size="icon"
            className="mr-1.5 mb-1.5 h-9 w-9 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-muted-foreground mt-2 text-center text-[10px]">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// CHAT TOGGLE BUTTON (for top controls)
// =============================================================================

interface ChatToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function ChatToggleButton({ isOpen, onClick }: ChatToggleButtonProps) {
  return (
    <Button
      variant={isOpen ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn(
        "gap-2 transition-all",
        isOpen && "bg-violet-600 hover:bg-violet-700",
      )}
    >
      <Sparkles className="h-4 w-4" />
      <span className="hidden sm:inline">AI Chat</span>
    </Button>
  );
}

// Chat panel uses /api/chat route for LLM responses
