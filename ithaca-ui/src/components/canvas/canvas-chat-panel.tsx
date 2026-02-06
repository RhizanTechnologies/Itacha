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

interface CanvasChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  graphContext: {
    nodeCount: number;
    edgeCount: number;
    selectedNode?: string | null;
    focusedCluster?: string | null;
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
  { icon: Lightbulb, label: "Most influential papers", query: "What are the most influential papers in this graph?" },
  { icon: Network, label: "Find connections", query: "Show me connections between selected papers" },
  { icon: TrendingUp, label: "Research trends", query: "What research trends do you see in this graph?" },
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
        "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize group",
        "hover:bg-primary/50 transition-colors",
        isDragging && "bg-primary"
      )}
    >
      <div className={cn(
        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        "opacity-0 group-hover:opacity-100 transition-opacity",
        isDragging && "opacity-100"
      )}>
        <GripVertical className="h-6 w-6 text-muted-foreground" />
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
  const handleResize = useCallback((delta: number) => {
    setWidth(prev => Math.min(maxWidth, Math.max(minWidth, prev + delta)));
  }, [minWidth, maxWidth]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    // Simulate AI response
    setTimeout(() => {
      const response = generateContextualResponse(messageText, graphContext);
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  }, [input, isTyping, graphContext]);

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
      className="h-full border-l border-border bg-background flex flex-col relative"
      style={{ width }}
    >
      {/* Resize Handle */}
      <ResizeHandle onResize={handleResize} />

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-violet-500/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Graph Assistant</h3>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground">
                {graphContext.nodeCount} papers · {graphContext.edgeCount} citations
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
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
          <div className="h-full flex flex-col p-4">
            {/* Welcome */}
            <div className="text-center mb-6 pt-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-7 w-7 text-violet-500" />
              </div>
              <h4 className="font-semibold mb-1">Explore this graph</h4>
              <p className="text-xs text-muted-foreground max-w-[260px] mx-auto">
                Ask questions about papers, find connections, or discover research insights
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                Quick questions
              </p>
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(action.query)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border text-left transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center border border-border group-hover:border-primary/30 transition-colors">
                    <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                {message.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-md"
                      : "bg-muted rounded-tl-md"
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 p-3 border-t border-border bg-background/50">
        <div className="flex items-end gap-2 bg-muted/50 rounded-xl border border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this graph..."
            rows={1}
            className="flex-1 bg-transparent px-4 py-3 text-sm resize-none focus:outline-none placeholder:text-muted-foreground/60 max-h-[100px] min-h-[44px]"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            size="icon"
            className="h-9 w-9 rounded-lg mr-1.5 mb-1.5"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
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
        isOpen && "bg-violet-600 hover:bg-violet-700"
      )}
    >
      <Sparkles className="h-4 w-4" />
      <span className="hidden sm:inline">AI Chat</span>
    </Button>
  );
}

// =============================================================================
// MOCK RESPONSE GENERATOR
// =============================================================================

function generateContextualResponse(query: string, context: CanvasChatPanelProps["graphContext"]): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes("influential") || lowerQuery.includes("key papers") || lowerQuery.includes("important")) {
    return `Based on the ${context.nodeCount} papers in this graph, the most influential nodes are those with high citation counts and central positions.\n\nLook for larger, more connected nodes   they typically represent foundational work in the field. You can click on any node to see its details and citation count.`;
  }
  
  if (lowerQuery.includes("connection") || lowerQuery.includes("path") || lowerQuery.includes("link")) {
    return `To find connections between papers:\n\n1. Enable selection mode (lasso icon)\n2. Select two or more papers\n3. Click "Compare" to see citation paths\n\nThe graph shows ${context.edgeCount} citation relationships   each edge represents one paper citing another.`;
  }
  
  if (lowerQuery.includes("trend") || lowerQuery.includes("evolution") || lowerQuery.includes("over time")) {
    return `To see how this field evolved:\n\n1. Use the year filter on the left\n2. Papers are colored by publication year\n3. Watch clusters form as you adjust the range\n\nDenser clusters often represent distinct research threads or methodological breakthroughs.`;
  }
  
  if (lowerQuery.includes("cluster") || lowerQuery.includes("group") || lowerQuery.includes("community")) {
    return `The graph layout naturally groups related papers together based on citation patterns.\n\nTry enabling the physics simulation (play button in controls) to see clusters form organically. Densely connected clusters often represent sub-fields or shared methodologies.`;
  }
  
  return `I can help you explore this graph of ${context.nodeCount} papers and ${context.edgeCount} citations.\n\nTry asking about:\n• Key papers or influential research\n• Connections between specific topics\n• Research trends over time\n• What the clusters represent`;
}
