import { describe, expect, it } from "vitest";
import Graph from "graphology";
import { buildDebateReport, renderDebateReportMarkdown } from "./debate-report";

describe("buildDebateReport", () => {
  it("includes contradictions, corrections, and low-confidence edges", () => {
    const graph = new Graph();
    graph.addNode("a", { title: "Paper A", year: 2020 });
    graph.addNode("b", { title: "Paper B", year: 2021 });
    graph.addNode("c", { title: "Paper C", year: 2022 });
    graph.addEdge("a", "b", {
      edgeType: "contradicts",
      confidence: 80,
      snippet: "However, we find the opposite result.",
    });
    graph.addEdge("b", "c", {
      edgeType: "supports",
      confidence: 30,
      signalSource: "llm+titles",
    });
    graph.addEdge("a", "c", {
      edgeType: "extends",
      confidence: 100,
      provider: "user-correction",
      snippet: "User corrected relationship to extends.",
    });

    const report = buildDebateReport(graph, {
      title: "Test Debate",
      query: "topic-test",
    });

    expect(report.contestedClaims).toHaveLength(3);
    expect(report.corrections).toHaveLength(1);
    expect(report.uncertainClaims).toHaveLength(1);

    const markdown = renderDebateReportMarkdown(report);
    expect(markdown).toContain("# Test Debate");
    expect(markdown).toContain("However, we find the opposite result.");
    expect(markdown).toContain("Human corrected");
  });

  it("returns empty contested sections for graphs without debate signal", () => {
    const graph = new Graph();
    graph.addNode("a", { title: "Paper A", year: 2020 });
    graph.addNode("b", { title: "Paper B", year: 2021 });
    graph.addEdge("a", "b", {
      edgeType: "supports",
      confidence: 92,
      signalSource: "llm+abstracts",
      snippet: "Our results align with prior work.",
    });
    graph.addEdge("b", "a", {
      edgeType: "cites",
      confidence: 88,
    });

    const report = buildDebateReport(graph, { title: "Quiet map" });
    expect(report.contestedClaims).toHaveLength(0);
    expect(report.corrections).toHaveLength(0);
    expect(report.uncertainClaims).toHaveLength(0);

    const markdown = renderDebateReportMarkdown(report);
    expect(markdown).toContain("No contested or uncertain claims");
    expect(markdown).toContain("No human corrections recorded");
  });

  it("filters out hidden edges and keeps only contested claims", () => {
    const graph = new Graph();
    graph.addNode("a", { title: "Paper A" });
    graph.addNode("b", { title: "Paper B" });
    graph.addNode("c", { title: "Paper C" });
    graph.addEdge("a", "b", {
      edgeType: "contradicts",
      confidence: 75,
      snippet: "Visible contested edge.",
    });
    graph.addEdge("b", "c", {
      edgeType: "supports",
      confidence: 95,
      hidden: true,
      snippet: "Hidden support should not export.",
    });

    const report = buildDebateReport(graph);
    expect(report.contestedClaims).toHaveLength(1);
    expect(report.contestedClaims[0].citedTitle).toBe("Paper B");
  });
});
