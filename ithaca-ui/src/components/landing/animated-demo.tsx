"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// ============================================================================
// TYPES
// ============================================================================

type EdgeType = "supports" | "refutes" | "extends";

interface DemoNode {
  id: number;
  x: number;
  y: number;
  label: string;
  author: string;
  year: number;
  journal: string;
  size: number;
  ring: number; // 0 = center, 1 = inner, 2 = outer
}

interface DemoEdge {
  from: number;
  to: number;
  type: EdgeType;
}

interface ResearchScenario {
  query: string;
  suggestions: string[];
  nodes: DemoNode[];
  edges: DemoEdge[];
  centralPaper: {
    title: string;
    abstract: string;
    citations: { supports: number; refutes: number; extends: number };
  };
  aiInsight: string;
  pathDescription: string;
}

// ============================================================================
// SCENARIO DATA
// ============================================================================

const SCENARIOS: ResearchScenario[] = [
  {
    query: "Does screen time affect child development?",
    suggestions: [
      "Does screen time affect child development?",
      "Screen time and cognitive development",
      "Digital media impact on children",
    ],
    nodes: [
      { id: 1, x: 50, y: 45, label: "Przybylski 2019", author: "Przybylski, A.K.", year: 2019, journal: "Nature Human Behaviour", size: 32, ring: 0 },
      { id: 2, x: 25, y: 28, label: "Twenge 2018", author: "Twenge, J.M.", year: 2018, journal: "Clinical Psych Science", size: 24, ring: 1 },
      { id: 3, x: 75, y: 25, label: "Orben 2019", author: "Orben, A.", year: 2019, journal: "Psychological Science", size: 26, ring: 1 },
      { id: 4, x: 18, y: 55, label: "Madigan 2019", author: "Madigan, S.", year: 2019, journal: "JAMA Pediatrics", size: 22, ring: 1 },
      { id: 5, x: 82, y: 52, label: "Stiglic 2019", author: "Stiglic, N.", year: 2019, journal: "BMJ Open", size: 20, ring: 1 },
      { id: 6, x: 30, y: 72, label: "Radesky 2020", author: "Radesky, J.S.", year: 2020, journal: "Pediatrics", size: 18, ring: 2 },
      { id: 7, x: 70, y: 75, label: "Anderson 2017", author: "Anderson, D.R.", year: 2017, journal: "Pediatrics", size: 20, ring: 2 },
      { id: 8, x: 50, y: 18, label: "AAP 2016", author: "AAP Council", year: 2016, journal: "Pediatrics", size: 28, ring: 1 },
      { id: 9, x: 12, y: 38, label: "Lillard 2015", author: "Lillard, A.S.", year: 2015, journal: "Dev Psychology", size: 16, ring: 2 },
      { id: 10, x: 88, y: 38, label: "Hutton 2020", author: "Hutton, J.S.", year: 2020, journal: "JAMA Pediatrics", size: 18, ring: 2 },
    ],
    edges: [
      { from: 1, to: 2, type: "refutes" },
      { from: 1, to: 3, type: "supports" },
      { from: 1, to: 8, type: "extends" },
      { from: 2, to: 4, type: "supports" },
      { from: 3, to: 5, type: "extends" },
      { from: 4, to: 6, type: "supports" },
      { from: 5, to: 7, type: "supports" },
      { from: 8, to: 2, type: "supports" },
      { from: 2, to: 9, type: "extends" },
      { from: 3, to: 10, type: "refutes" },
      { from: 6, to: 7, type: "extends" },
    ],
    centralPaper: {
      title: "The association between adolescent well-being and digital technology use",
      abstract: "Using large-scale representative data, we demonstrate that screen time has minimal effects on adolescent well-being, challenging previous assumptions about digital technology harm...",
      citations: { supports: 23, refutes: 8, extends: 15 },
    },
    aiInsight: "Interesting debate here! Przybylski 2019 directly challenges Twenge's findings, showing screen time effects are minimal. The path reveals a methodological dispute about data analysis approaches.",
    pathDescription: "Citation path: methodological debate",
  },
  {
    query: "What causes coral reef bleaching?",
    suggestions: [
      "What causes coral reef bleaching?",
      "Climate change coral impact",
      "Ocean acidification effects",
    ],
    nodes: [
      { id: 1, x: 50, y: 45, label: "Hughes 2017", author: "Hughes, T.P.", year: 2017, journal: "Nature", size: 32, ring: 0 },
      { id: 2, x: 28, y: 25, label: "Hoegh-Guldberg 2007", author: "Hoegh-Guldberg, O.", year: 2007, journal: "Science", size: 28, ring: 1 },
      { id: 3, x: 72, y: 28, label: "Baker 2008", author: "Baker, A.C.", year: 2008, journal: "Nature", size: 22, ring: 1 },
      { id: 4, x: 20, y: 55, label: "Pandolfi 2011", author: "Pandolfi, J.M.", year: 2011, journal: "Science", size: 24, ring: 1 },
      { id: 5, x: 80, y: 55, label: "Anthony 2008", author: "Anthony, K.R.N.", year: 2008, journal: "PNAS", size: 20, ring: 1 },
      { id: 6, x: 35, y: 75, label: "Fabricius 2011", author: "Fabricius, K.E.", year: 2011, journal: "Nature Clim.", size: 18, ring: 2 },
      { id: 7, x: 65, y: 78, label: "Veron 2009", author: "Veron, J.E.N.", year: 2009, journal: "Mar. Poll. Bull.", size: 16, ring: 2 },
      { id: 8, x: 50, y: 15, label: "IPCC 2019", author: "IPCC", year: 2019, journal: "Special Report", size: 26, ring: 1 },
    ],
    edges: [
      { from: 1, to: 2, type: "extends" },
      { from: 1, to: 3, type: "refutes" },
      { from: 1, to: 8, type: "supports" },
      { from: 2, to: 4, type: "supports" },
      { from: 3, to: 5, type: "supports" },
      { from: 4, to: 6, type: "extends" },
      { from: 5, to: 7, type: "extends" },
      { from: 2, to: 8, type: "supports" },
      { from: 6, to: 7, type: "supports" },
    ],
    centralPaper: {
      title: "Global warming and recurrent mass bleaching of corals",
      abstract: "We document the third pan-tropical episode of coral bleaching in 2015-2016, demonstrating that global warming is the primary driver of mass bleaching events...",
      citations: { supports: 156, refutes: 12, extends: 89 },
    },
    aiInsight: "Strong consensus here. Hughes 2017 provides definitive evidence linking warming to bleaching. Baker 2008 offers a contrarian view on coral adaptation, but subsequent research hasn't supported it.",
    pathDescription: "Citation path: climate consensus",
  },
  {
    query: "Is LLM reasoning truly emergent?",
    suggestions: [
      "Is LLM reasoning truly emergent?",
      "Emergent abilities large language models",
      "GPT reasoning capabilities",
    ],
    nodes: [
      { id: 1, x: 50, y: 45, label: "Wei 2022", author: "Wei, J. et al.", year: 2022, journal: "NeurIPS", size: 32, ring: 0 },
      { id: 2, x: 25, y: 30, label: "Schaeffer 2023", author: "Schaeffer, R.", year: 2023, journal: "arXiv", size: 26, ring: 1 },
      { id: 3, x: 75, y: 28, label: "Bubeck 2023", author: "Bubeck, S.", year: 2023, journal: "arXiv", size: 24, ring: 1 },
      { id: 4, x: 18, y: 58, label: "Kojima 2022", author: "Kojima, T.", year: 2022, journal: "NeurIPS", size: 22, ring: 1 },
      { id: 5, x: 82, y: 55, label: "Huang 2023", author: "Huang, J.", year: 2023, journal: "ACL", size: 20, ring: 1 },
      { id: 6, x: 32, y: 75, label: "Srivastava 2023", author: "Srivastava, A.", year: 2023, journal: "TMLR", size: 20, ring: 2 },
      { id: 7, x: 68, y: 78, label: "Lewkowycz 2022", author: "Lewkowycz, A.", year: 2022, journal: "NeurIPS", size: 18, ring: 2 },
      { id: 8, x: 50, y: 15, label: "Brown 2020", author: "Brown, T.", year: 2020, journal: "NeurIPS", size: 28, ring: 1 },
    ],
    edges: [
      { from: 1, to: 2, type: "refutes" },
      { from: 1, to: 3, type: "supports" },
      { from: 1, to: 8, type: "extends" },
      { from: 2, to: 4, type: "refutes" },
      { from: 3, to: 5, type: "supports" },
      { from: 4, to: 6, type: "extends" },
      { from: 5, to: 7, type: "extends" },
      { from: 8, to: 1, type: "supports" },
      { from: 6, to: 7, type: "supports" },
    ],
    centralPaper: {
      title: "Emergent Abilities of Large Language Models",
      abstract: "We analyze the emergence of capabilities in large language models as a function of scale, identifying abilities that appear suddenly at certain parameter thresholds...",
      citations: { supports: 89, refutes: 34, extends: 67 },
    },
    aiInsight: "Hot debate! Schaeffer 2023 argues emergence is a 'mirage' caused by metric choice. This fundamentally challenges Wei's influential findings. The field is actively divided on this.",
    pathDescription: "Citation path: emergence debate",
  },
];

// ============================================================================
// CONSTANTS
// ============================================================================

const EDGE_COLORS: Record<EdgeType, string> = {
  supports: "#22c55e",
  refutes: "#ef4444",
  extends: "#3b82f6",
};

const EDGE_LABELS: Record<EdgeType, string> = {
  supports: "Supports",
  refutes: "Refutes",
  extends: "Extends",
};

// ============================================================================
// ANIMATION PHASES
// ============================================================================

type Phase =
  | "idle"
  | "typing"
  | "suggestions"
  | "loading"
  | "graph-enter"
  | "graph-settle"
  | "hover"
  | "select"
  | "path"
  | "inspector"
  | "ai-insight"
  | "zoom-out"
  | "reset";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AnimatedDemo() {
  const prefersReducedMotion = useReducedMotion();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [searchText, setSearchText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
  const [showPath, setShowPath] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiTypingText, setAiTypingText] = useState("");
  const [graphScale, setGraphScale] = useState(1);
  const [visibleNodes, setVisibleNodes] = useState<number[]>([]);
  const [visibleEdges, setVisibleEdges] = useState<number[]>([]);

  const scenario = SCENARIOS[scenarioIndex];

  // Reset state for new cycle
  const resetState = useCallback(() => {
    setSearchText("");
    setShowSuggestions(false);
    setHoveredNode(null);
    setSelectedNodes([]);
    setShowPath(false);
    setShowInspector(false);
    setShowAiChat(false);
    setAiTypingText("");
    setGraphScale(1);
    setVisibleNodes([]);
    setVisibleEdges([]);
  }, []);

  // Main animation orchestrator
  useEffect(() => {
    if (prefersReducedMotion) {
      // Show static version for reduced motion
      setVisibleNodes(scenario.nodes.map((n) => n.id));
      setVisibleEdges(scenario.edges.map((_, i) => i));
      return;
    }

    let cancelled = false;
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const runAnimation = async () => {
      resetState();
      await delay(500);

      // PHASE 1: Typing (3s)
      setPhase("typing");
      const query = scenario.query;
      for (let i = 0; i <= query.length && !cancelled; i++) {
        setSearchText(query.slice(0, i));
        await delay(50 + Math.random() * 30);
      }
      if (cancelled) return;

      // PHASE 2: Show suggestions (1s)
      setPhase("suggestions");
      setShowSuggestions(true);
      await delay(1000);
      if (cancelled) return;

      // PHASE 3: Loading (0.8s)
      setPhase("loading");
      setShowSuggestions(false);
      await delay(800);
      if (cancelled) return;

      // PHASE 4: Graph enter - nodes appear by ring (2.5s)
      setPhase("graph-enter");

      // Center node first
      const centerNodes = scenario.nodes
        .filter((n) => n.ring === 0)
        .map((n) => n.id);
      setVisibleNodes(centerNodes);
      await delay(400);
      if (cancelled) return;

      // Ring 1
      const ring1Nodes = scenario.nodes
        .filter((n) => n.ring === 1)
        .map((n) => n.id);
      setVisibleNodes([...centerNodes, ...ring1Nodes]);
      await delay(400);
      if (cancelled) return;

      // Ring 2
      const ring2Nodes = scenario.nodes
        .filter((n) => n.ring === 2)
        .map((n) => n.id);
      setVisibleNodes([...centerNodes, ...ring1Nodes, ...ring2Nodes]);
      await delay(300);
      if (cancelled) return;

      // Edges appear sequentially
      for (let i = 0; i < scenario.edges.length && !cancelled; i++) {
        setVisibleEdges((prev) => [...prev, i]);
        await delay(120);
      }
      if (cancelled) return;

      // PHASE 5: Graph settle (1s)
      setPhase("graph-settle");
      await delay(1000);
      if (cancelled) return;

      // PHASE 6: Hover effect (1.5s)
      setPhase("hover");
      setHoveredNode(1);
      await delay(1500);
      if (cancelled) return;

      // PHASE 7: Select first node (1.5s)
      setPhase("select");
      setHoveredNode(null);
      setSelectedNodes([1]);
      await delay(1500);
      if (cancelled) return;

      // PHASE 8: Select second node and show path (2s)
      setPhase("path");
      setSelectedNodes([1, 2]);
      await delay(500);
      setShowPath(true);
      await delay(1500);
      if (cancelled) return;

      // PHASE 9: Show inspector (2s)
      setPhase("inspector");
      setShowInspector(true);
      await delay(2000);
      if (cancelled) return;

      // PHASE 10: AI insight appears with typing (4s)
      setPhase("ai-insight");
      setShowAiChat(true);
      const insight = scenario.aiInsight;
      for (let i = 0; i <= insight.length && !cancelled; i++) {
        setAiTypingText(insight.slice(0, i));
        await delay(20);
      }
      await delay(2000);
      if (cancelled) return;

      // PHASE 11: Zoom out (1.5s)
      setPhase("zoom-out");
      setGraphScale(0.85);
      await delay(1500);
      if (cancelled) return;

      // PHASE 12: Reset and cycle
      setPhase("reset");
      await delay(500);
      setScenarioIndex((i) => (i + 1) % SCENARIOS.length);
    };

    runAnimation();

    return () => {
      cancelled = true;
    };
  }, [scenarioIndex, scenario, prefersReducedMotion, resetState]);

  // Helper functions
  const getNodePosition = (node: DemoNode) => ({
    left: `${node.x}%`,
    top: `${node.y}%`,
  });

  const getEdgePath = (edge: DemoEdge) => {
    const fromNode = scenario.nodes.find((n) => n.id === edge.from)!;
    const toNode = scenario.nodes.find((n) => n.id === edge.to)!;
    return { x1: fromNode.x, y1: fromNode.y, x2: toNode.x, y2: toNode.y };
  };

  const isNodeConnectedToSelected = (nodeId: number) => {
    if (selectedNodes.length === 0) return true;
    if (selectedNodes.includes(nodeId)) return true;
    return scenario.edges.some(
      (e) =>
        (selectedNodes.includes(e.from) && e.to === nodeId) ||
        (selectedNodes.includes(e.to) && e.from === nodeId)
    );
  };

  const isEdgeConnectedToSelected = (edge: DemoEdge) => {
    if (selectedNodes.length === 0) return true;
    return selectedNodes.includes(edge.from) || selectedNodes.includes(edge.to);
  };

  const isOnPath = (nodeId: number) => {
    if (!showPath || selectedNodes.length < 2) return false;
    return selectedNodes.includes(nodeId);
  };

  const isPathEdge = (edge: DemoEdge) => {
    if (!showPath || selectedNodes.length < 2) return false;
    return selectedNodes.includes(edge.from) && selectedNodes.includes(edge.to);
  };

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-video bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-lg sm:rounded-xl overflow-hidden select-none">
      {/* Animated background particles */}
      <BackgroundParticles />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.07]">
        <svg className="w-full h-full">
          <defs>
            <pattern
              id="demo-grid"
              width="30"
              height="30"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="15"
                cy="15"
                r="1"
                fill="currentColor"
                className="text-slate-400"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#demo-grid)" />
        </svg>
      </div>

      {/* Search bar */}
      <motion.div
        className="absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 w-[88%] sm:w-[70%] md:w-[55%] max-w-lg z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <div className="bg-slate-800/90 backdrop-blur-md rounded-lg sm:rounded-xl border border-slate-700/80 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 shadow-xl">
            <SearchIcon className="hidden sm:block" />
            <span className="text-slate-200 text-xs sm:text-sm flex-1 font-mono tracking-tight truncate">
              {searchText}
              {(phase === "typing" || phase === "idle") && (
                <motion.span
                  className="inline-block w-0.5 h-4 bg-primary ml-0.5 -mb-0.5"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.53, repeat: Infinity }}
                />
              )}
            </span>
            {searchText && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded"
              >
                ⏎
              </motion.div>
            )}
          </div>

          {/* Autocomplete suggestions */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: -10, scaleY: 0.8 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -10, scaleY: 0.8 }}
                className="absolute top-full left-0 right-0 mt-1.5 sm:mt-2 bg-slate-800/95 backdrop-blur-md rounded-lg border border-slate-700/80 overflow-hidden shadow-2xl origin-top"
              >
                {scenario.suggestions.slice(0, typeof window !== 'undefined' && window.innerWidth < 640 ? 1 : 3).map((suggestion, i) => (
                  <motion.div
                    key={suggestion}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm flex items-center gap-2 sm:gap-3 ${
                      i === 0
                        ? "bg-primary/20 text-primary"
                        : "text-slate-300 hover:bg-slate-700/50"
                    }`}
                  >
                    <SearchIcon small className="hidden sm:block" />
                    <span className="truncate">{suggestion}</span>
                    {i === 0 && (
                      <span className="ml-auto text-[8px] sm:text-[10px] text-primary/70 bg-primary/10 px-1 sm:px-1.5 py-0.5 rounded whitespace-nowrap">
                        Top result
                      </span>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Loading indicator */}
      <AnimatePresence>
        {phase === "loading" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-primary"
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] sm:text-xs text-slate-500">
                Analyzing citation network...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main graph area */}
      <motion.div
        className="absolute inset-0 pt-14 sm:pt-20 pb-10 sm:pb-12 px-2 sm:px-4"
        animate={{ scale: graphScale }}
        transition={{ type: "spring", damping: 20 }}
      >
        {/* Edges SVG layer */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ top: "5rem" }}
        >
          <defs>
            {/* Glow filters for edges */}
            <filter
              id="glow-green"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter
              id="glow-blue"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {scenario.edges.map((edge, i) => {
            const path = getEdgePath(edge);
            const visible = visibleEdges.includes(i);
            const connected = isEdgeConnectedToSelected(edge);
            const onPath = isPathEdge(edge);

            return (
              <motion.line
                key={`edge-${i}`}
                x1={`${path.x1}%`}
                y1={`${path.y1}%`}
                x2={`${path.x2}%`}
                y2={`${path.y2}%`}
                stroke={EDGE_COLORS[edge.type]}
                strokeWidth={onPath ? 3 : connected ? 2 : 1.5}
                strokeDasharray={onPath ? "8 4" : "none"}
                filter={
                  onPath
                    ? `url(#glow-${edge.type === "supports" ? "green" : edge.type === "refutes" ? "red" : "blue"})`
                    : undefined
                }
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: visible ? 1 : 0,
                  opacity: visible
                    ? selectedNodes.length > 0
                      ? connected
                        ? 0.9
                        : 0.15
                      : 0.7
                    : 0,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        <AnimatePresence>
          {scenario.nodes.map((node) => {
            const pos = getNodePosition(node);
            const visible = visibleNodes.includes(node.id);
            const isSelected = selectedNodes.includes(node.id);
            const isHovered = hoveredNode === node.id;
            const connected = isNodeConnectedToSelected(node.id);
            const onPath = isOnPath(node.id);

            if (!visible) return null;

            return (
              <motion.div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: pos.left, top: pos.top }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: selectedNodes.length > 0 ? (connected ? 1 : 0.25) : 1,
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 300 }}
              >
                {/* Selection/path ring */}
                {(isSelected || onPath) && (
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      width: node.size + 16,
                      height: node.size + 16,
                      left: -8,
                      top: -8,
                      background: `radial-gradient(circle, ${isSelected ? "rgba(139, 92, 246, 0.4)" : "rgba(139, 92, 246, 0.2)"} 0%, transparent 70%)`,
                    }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                {/* Hover ring */}
                {isHovered && !isSelected && (
                  <motion.div
                    className="absolute rounded-full border-2 border-primary/50"
                    style={{
                      width: node.size + 12,
                      height: node.size + 12,
                      left: -6,
                      top: -6,
                    }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  />
                )}

                {/* Node circle */}
                <motion.div
                  className={`rounded-full shadow-lg transition-all duration-200 ${
                    isSelected
                      ? "bg-primary ring-2 ring-primary ring-offset-2 ring-offset-slate-900"
                      : isHovered
                        ? "bg-slate-600 ring-2 ring-slate-500"
                        : "bg-slate-700"
                  }`}
                  style={{
                    width: node.size,
                    height: node.size,
                    boxShadow: isSelected
                      ? "0 0 20px rgba(139, 92, 246, 0.5)"
                      : "0 4px 12px rgba(0,0,0,0.3)",
                  }}
                  whileHover={{ scale: 1.1 }}
                />

                {/* Node label - show selected always, others only on desktop or when nothing selected */}
                <AnimatePresence>
                  {(isSelected || isHovered || selectedNodes.length === 0) && (
                    <motion.div
                      className={`absolute top-full mt-1 sm:mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap ${
                        !isSelected && !isHovered ? 'hidden sm:block' : ''
                      }`}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-[8px] sm:text-[10px] text-slate-300 bg-slate-900/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded sm:rounded-md border border-slate-700/50 shadow-lg max-w-[80px] sm:max-w-none truncate">
                        {node.label}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover tooltip with more info - desktop only */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 hidden sm:block"
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    >
                      <div className="bg-slate-800/95 backdrop-blur-md rounded-lg border border-slate-700 p-3 shadow-2xl">
                        <div className="text-[10px] text-slate-500 mb-1">
                          {node.journal}
                        </div>
                        <div className="text-xs text-slate-200 font-medium">
                          {node.author}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {node.year}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Inspector panel - hidden on mobile */}
      <AnimatePresence>
        {showInspector && (
          <motion.div
            className="absolute right-3 top-16 bottom-14 w-56 z-20 hidden md:block"
            initial={{ x: 240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 240, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="h-full bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-700/80 overflow-hidden shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-3 border-b border-slate-700/80 bg-slate-800/50">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Selected Paper
                </div>
                <h3 className="text-xs font-semibold text-slate-100 leading-tight">
                  {scenario.nodes[0].label}
                </h3>
              </div>

              {/* Content */}
              <div className="p-3 space-y-3 flex-1 overflow-auto">
                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                    Title
                  </div>
                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    {scenario.centralPaper.title}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                    Journal
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {scenario.nodes[0].journal}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">
                    Citations
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <CitationBadge
                      type="supports"
                      count={scenario.centralPaper.citations.supports}
                    />
                    <CitationBadge
                      type="refutes"
                      count={scenario.centralPaper.citations.refutes}
                    />
                    <CitationBadge
                      type="extends"
                      count={scenario.centralPaper.citations.extends}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                    Abstract
                  </div>
                  <div className="text-[10px] text-slate-400 leading-relaxed line-clamp-4">
                    {scenario.centralPaper.abstract}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-2 border-t border-slate-700/80 bg-slate-800/30">
                <div className="flex gap-1.5">
                  <div className="flex-1 text-center py-1.5 rounded bg-primary/20 text-primary text-[10px] font-medium">
                    View Paper
                  </div>
                  <div className="flex-1 text-center py-1.5 rounded bg-slate-700/50 text-slate-400 text-[10px]">
                    Cite
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chat bubble - Full on desktop, compact toast on mobile */}
      <AnimatePresence>
        {showAiChat && (
          <>
            {/* Desktop version */}
            <motion.div
              className="absolute left-3 bottom-14 w-64 z-20 hidden sm:block"
              initial={{ y: 20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <div className="bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-3 py-2 border-b border-slate-700/80 bg-gradient-to-r from-primary/20 to-transparent flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center">
                    <SparklesIcon />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200">
                    AI Research Assistant
                  </span>
                </div>

                {/* Message */}
                <div className="p-3">
                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    {aiTypingText}
                    {aiTypingText.length < scenario.aiInsight.length && (
                      <motion.span
                        className="inline-block w-1 h-3 bg-primary/70 ml-0.5"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.4, repeat: Infinity }}
                      />
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                {aiTypingText.length === scenario.aiInsight.length && (
                  <motion.div
                    className="px-3 pb-3 flex gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="text-[9px] px-2 py-1 rounded-full bg-slate-700/50 text-slate-400 cursor-pointer hover:bg-slate-700">
                      Tell me more
                    </div>
                    <div className="text-[9px] px-2 py-1 rounded-full bg-slate-700/50 text-slate-400 cursor-pointer hover:bg-slate-700">
                      Find similar
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Mobile compact toast version */}
            <motion.div
              className="absolute left-2 right-2 bottom-10 z-20 sm:hidden"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <div className="bg-slate-800/95 backdrop-blur-md rounded-lg border border-slate-700/80 shadow-xl px-3 py-2 flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                  <SparklesIcon />
                </div>
                <div className="text-[10px] text-slate-300 leading-relaxed line-clamp-2 flex-1">
                  {aiTypingText.slice(0, 80)}{aiTypingText.length > 80 ? '...' : ''}
                  {aiTypingText.length < scenario.aiInsight.length && (
                    <motion.span
                      className="inline-block w-1 h-2.5 bg-primary/70 ml-0.5"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.4, repeat: Infinity }}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Path indicator */}
      <AnimatePresence>
        {showPath && (
          <motion.div
            className="absolute top-12 sm:top-16 left-1/2 -translate-x-1/2 z-20"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
          >
            <div className="bg-slate-800/90 backdrop-blur-md rounded-full border border-slate-700 px-2.5 sm:px-4 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2 shadow-lg">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary/20 flex items-center justify-center">
                <PathIcon />
              </div>
              <span className="text-[9px] sm:text-[11px] text-slate-300">
                <span className="hidden sm:inline">{scenario.pathDescription}</span>
                <span className="sm:hidden">Comparing papers</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend - compact on mobile */}
      <motion.div
        className="absolute bottom-3 left-2 sm:left-3 flex items-center gap-2 sm:gap-4 z-10"
        initial={{ opacity: 0 }}
        animate={{
          opacity: visibleEdges.length > 0 ? 1 : 0,
        }}
        transition={{ delay: 0.5 }}
      >
        {Object.entries(EDGE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1 sm:gap-1.5">
            <span
              className="w-3 sm:w-4 h-0.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[8px] sm:text-[10px] text-slate-500 hidden sm:inline">
              {EDGE_LABELS[type as EdgeType]}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Paper count */}
      <AnimatePresence>
        {visibleNodes.length > 0 && (
          <motion.div
            className="absolute bottom-3 right-2 sm:right-3 z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.5 }}
          >
            <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-[8px] sm:text-[10px] text-slate-400 flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="hidden sm:inline">{visibleNodes.length} papers · {visibleEdges.length} citations</span>
              <span className="sm:hidden">{visibleNodes.length} · {visibleEdges.length}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scenario indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {SCENARIOS.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === scenarioIndex ? "bg-primary" : "bg-slate-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function BackgroundParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

function SearchIcon({ small, className }: { small?: boolean; className?: string }) {
  return (
    <svg
      className={`${small ? "w-3.5 h-3.5" : "w-4 h-4"} text-slate-400 ${className || ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" />
    </svg>
  );
}

function PathIcon() {
  return (
    <svg
      className="w-2.5 h-2.5 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  );
}

function CitationBadge({ type, count }: { type: EdgeType; count: number }) {
  const colors = {
    supports: "bg-green-500/20 text-green-400",
    refutes: "bg-red-500/20 text-red-400",
    extends: "bg-blue-500/20 text-blue-400",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${colors[type]}`}>
      {count} {type}
    </span>
  );
}
