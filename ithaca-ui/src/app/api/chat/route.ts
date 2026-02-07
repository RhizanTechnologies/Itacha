/**
 * Canvas Chat API Route
 *
 * POST /api/chat
 * Body: { message: string, graphContext: { nodeCount, edgeCount, selectedNode?, papers?: [...] }, history?: { role, content }[] }
 * Returns: { response: string }
 *
 * Uses the LLM router to generate contextual responses about the graph.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLLMRouter, type LLMMessage } from "@/lib/api/llm-router";

// =============================================================================
// VALIDATION
// =============================================================================

const requestSchema = z.object({
  message: z.string().min(1).max(2000),
  graphContext: z.object({
    nodeCount: z.number(),
    edgeCount: z.number(),
    selectedNode: z.string().nullable().optional(),
    focusedCluster: z.string().nullable().optional(),
    papers: z
      .array(
        z.object({
          title: z.string(),
          authors: z.string(),
          year: z.number(),
          citations: z.number(),
          supports: z.number().optional(),
          refutes: z.number().optional(),
        }),
      )
      .max(30)
      .optional(),
  }),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(20)
    .optional(),
});

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

const SYSTEM_PROMPT = `You are Ithaca, an AI research assistant embedded in a citation graph explorer. You help researchers understand academic paper relationships.

Context about the current graph:
- You can see citation relationships between papers
- Edges are classified as: supports (green), contradicts (red), or extends (blue)
- Users can expand nodes to see citing/cited papers
- Users can compare paths between papers

Your role:
- Help users understand the research landscape shown in the graph
- Explain citation relationships and patterns
- Suggest exploration strategies (which papers to expand, paths to compare)
- Be concise and actionable — researchers are busy
- Reference specific graph features (selection mode, filters, focus mode) when relevant

Keep responses under 150 words unless the user asks for detail. Use markdown formatting sparingly (bold for emphasis, bullet points for lists).`;

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { message, graphContext, history = [] } = parsed.data;

    const router = getLLMRouter();

    // Build context-aware system prompt
    let contextInfo = `\n\nCurrent graph state: ${graphContext.nodeCount} papers, ${graphContext.edgeCount} citation edges.`;
    
    if (graphContext.selectedNode) {
      contextInfo += ` Currently selected: ${graphContext.selectedNode}.`;
    }

    // Inject real paper data so the LLM knows what's in the graph
    const papers = graphContext.papers || [];
    if (papers.length > 0) {
      contextInfo += `\n\nPapers in this graph (sorted by citations):\n`;
      const sorted = [...papers].sort((a, b) => b.citations - a.citations);
      sorted.forEach((p, i) => {
        let line = `${i + 1}. "${p.title}" by ${p.authors.split(",")[0]} et al. (${p.year}) — ${p.citations} citations`;
        if ((p.supports ?? 0) > 0 || (p.refutes ?? 0) > 0) {
          line += ` [${p.supports ?? 0} supporting, ${p.refutes ?? 0} contradicting]`;
        }
        contextInfo += line + "\n";
      });
    }

    const messages: LLMMessage[] = [
      { role: "system", content: SYSTEM_PROMPT + contextInfo },
      // Include recent history for conversation continuity (last 10 messages)
      ...history.slice(-10).map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const response = await router.chat(messages);

    return NextResponse.json({ response: response.content });
  } catch (error) {
    console.error("[/api/chat] Error:", error);

    return NextResponse.json(
      {
        error: "Chat failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
