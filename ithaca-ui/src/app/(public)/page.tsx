"use client";

import { useState } from "react";
import { useAnimationPause } from "@/hooks/useAnimationPause";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { OnboardingDialog } from "@/components/auth/onboarding-dialog";
import {
  ArrowRight,
  Search,
  MousePointerClick,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  Shield,
  Users,
  BookOpen,
  GraduationCap,
  FileText,
  Play,
  AlertTriangle,
  GitFork,
  ExternalLink,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { GraphConstellation } from "@/components/visual/graph-constellation";
import { AnimatedDemo } from "@/components/landing/animated-demo";
import { PLAN_ENTITLEMENTS } from "@/lib/platform/org-plans";

// Features data
const FEATURES = [
  {
    icon: <CheckCircle2 className="text-supports h-5 w-5" />,
    badgeColor: "bg-supports/15 text-supports border-supports/25",
    title: "Argument Visualization",
    description:
      "Instantly distinguish papers that support, contradict, or extend each other. Navigate the genuine consensus landscape beyond citation counts.",
  },
  {
    icon: <FileText className="text-primary h-5 w-5" />,
    badgeColor: "bg-primary/15 text-primary border-primary/25",
    title: "Passage-Level Citations",
    description:
      "Click any edge to reveal the exact source passages establishing the relationship. Complete transparency and verified evidentiary provenance.",
  },
  {
    icon: <Sparkles className="text-accent-foreground h-5 w-5" />,
    badgeColor: "bg-accent text-accent-foreground border-border",
    title: "AI Confidence Reasoning",
    description:
      "Every inferred relationship provides machine confidence scores, methodological nuance, and contextual reasoning so you know why connections exist.",
  },
  {
    icon: <MousePointerClick className="text-extends h-5 w-5" />,
    badgeColor: "bg-extends/15 text-extends border-extends/25",
    title: "Dynamic Graph Canvas",
    description:
      "Interactive spatial layout with GPU acceleration, pan-and-zoom controls, radial expansion, and keyboard shortcuts built for deep exploration.",
  },
  {
    icon: <Users className="text-primary h-5 w-5" />,
    badgeColor: "bg-primary/15 text-primary border-primary/25",
    title: "Collaborative Landscapes",
    description:
      "Save curated research maps, export high-resolution vector figures for publications or grant proposals, and share live canvases with collaborators.",
  },
  {
    icon: <Shield className="text-supports h-5 w-5" />,
    badgeColor: "bg-supports/15 text-supports border-supports/25",
    title: "Team & Lab Workspaces",
    description:
      "Organization-scoped domains, RBAC roles (Owner, Admin, Member, Viewer), and centralized AI compute quotas tailored for academic groups.",
  },
];

// How it works steps
const STEPS = [
  {
    step: "01",
    title: "Query any domain",
    description:
      "Enter a research hypothesis, seminal paper DOI, or emerging scientific question to seed the graph.",
    icon: Search,
  },
  {
    step: "02",
    title: "Explore the discourse",
    description:
      "Navigate an argumentation-aware topological network showing how papers validate, challenge, or extend one another.",
    icon: MousePointerClick,
  },
  {
    step: "03",
    title: "Synthesize breakthroughs",
    description:
      "Identify open debates, uncover hidden contradictions, and isolate unexplored research gaps in minutes.",
    icon: Lightbulb,
  },
];

// Use cases
const USE_CASES = [
  {
    icon: GraduationCap,
    badge: "EARLY CAREER",
    title: "PhD Students & Postdocs",
    description:
      "Master a new research domain in days rather than months. Grasp foundational debates and avoid building on debunked methodologies.",
  },
  {
    icon: Users,
    badge: "LAB GROUPS",
    title: "Research Teams & PIs",
    description:
      "Accelerate collaborative literature reviews. Map competitive landscapes, synchronize lab findings, and pool institutional knowledge.",
  },
  {
    icon: BookOpen,
    badge: "RESEARCH STRATEGY",
    title: "Grant Writers & Reviewers",
    description:
      "Demonstrate empirical novelty with precise epistemological mapping. Cite foundational consensus and highlight unmet scientific needs.",
  },
];

export default function Home() {
  useAnimationPause();

  const [showSignIn, setShowSignIn] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* ===== HERO SECTION ===== */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        {/* Background Elements */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="from-primary/5 via-background/40 to-background absolute inset-0 bg-gradient-to-b" />
          <div className="hero-bg">
            <div className="blob blob--primary" />
            <div className="blob blob--accent" />
          </div>
        </div>

        <GraphConstellation className="pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
          <Stagger className="mx-auto max-w-4xl space-y-8 text-center">
            {/* Badge */}
            <StaggerItem>
              <span className="border-border/80 bg-background/80 text-muted-foreground shadow-xs inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="bg-supports absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                  <span className="bg-supports relative inline-flex h-2 w-2 rounded-full" />
                </span>
                Beyond citations. Understand the debate.
              </span>
            </StaggerItem>

            {/* Main Headline */}
            <StaggerItem>
              <h1 className="text-4xl leading-[1.12] font-black tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Navigate any research field in{" "}
                <span className="from-primary via-chart-1 to-accent bg-gradient-to-r bg-clip-text text-transparent">
                  minutes, not months
                </span>
              </h1>
            </StaggerItem>

            {/* Subheadline */}
            <StaggerItem>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed md:text-xl">
                Ithaca maps how scientific papers{" "}
                <strong className="text-supports font-semibold">support</strong>
                ,{" "}
                <strong className="text-contradicts font-semibold">
                  contradict
                </strong>
                , and{" "}
                <strong className="text-extends font-semibold">extend</strong>{" "}
                each other so you see the real scientific conversation, not just
                references.
              </p>
            </StaggerItem>

            {/* CTAs */}
            <StaggerItem>
              <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
                <Button
                  size="lg"
                  className="shadow-primary/20 gap-2 px-8 text-base shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
                  onClick={() => setShowSignIn(true)}
                >
                  Start Exploring Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border/80 bg-background/60 hover:bg-muted/60 gap-2 px-8 text-base backdrop-blur-sm transition-transform active:scale-[0.98]"
                  onClick={() =>
                    document
                      .getElementById("demo")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <Play className="h-4 w-4 fill-current" />
                  Interactive Demo
                </Button>
              </div>
            </StaggerItem>

            {/* Trust note */}
            <StaggerItem>
              <p className="text-muted-foreground pt-2 text-sm">
                Free for researchers • No credit card required • Instant access
              </p>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* ===== EARLY ACCESS NOTE ===== */}
      <section className="border-border/60 bg-muted/20 border-y py-6">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="flex flex-col items-center justify-center gap-3 text-center md:flex-row">
              <span className="border-supports/30 bg-supports/10 text-supports inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                BUILDING IN PUBLIC
              </span>
              <span className="text-muted-foreground text-sm">
                Ithaca is in active development. We are rolling out epistemic
                intelligence features continuously with our scientific community.
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== PROBLEM-AGITATION-SOLUTION ===== */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <div className="mb-16 text-center">
                <span className="border-border bg-muted/50 text-muted-foreground mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                  THE SCIENTIFIC BOTTLENECK
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                  Why traditional literature review fails
                </h2>
                <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                  Standard search engines index citations as flat hyperlinks.
                  They cannot tell you whether a citation confirmed an effect or
                  proved it was a statistical artifact.
                </p>
              </div>
            </Reveal>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Problem Card */}
              <Reveal delay={0.1}>
                <div className="border-contradicts/20 bg-card/60 hover:border-contradicts/40 relative flex h-full flex-col rounded-3xl border p-8 shadow-xs backdrop-blur-sm transition-all">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="border-contradicts/30 bg-contradicts/10 text-contradicts inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                      The Status Quo
                    </span>
                    <AlertTriangle className="text-contradicts h-5 w-5" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">
                    The Blind Citation Network
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    Researchers sift through hundreds of papers in isolation.
                    Citation counts show fame, not reproducibility, hiding
                    critical refutations beneath mountains of publications.
                  </p>
                  <ul className="text-muted-foreground mt-auto space-y-3 text-sm">
                    <li className="flex items-start gap-2.5">
                      <span className="bg-contradicts/15 text-contradicts mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                        ✕
                      </span>
                      <span>
                        Months lost pursuing hypotheses already contradicted in
                        the literature.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="bg-contradicts/15 text-contradicts mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                        ✕
                      </span>
                      <span>
                        No passage-level transparency—you must read entire PDFs
                        to locate the claim context.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="bg-contradicts/15 text-contradicts mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                        ✕
                      </span>
                      <span>
                        Isolated, siloed researcher notes with zero shared lab
                        topography.
                      </span>
                    </li>
                  </ul>
                </div>
              </Reveal>

              {/* Solution Card */}
              <Reveal delay={0.2}>
                <div className="border-supports/30 bg-card/60 hover:border-supports/50 shadow-supports/5 relative flex h-full flex-col rounded-3xl border p-8 shadow-lg backdrop-blur-sm transition-all">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="border-supports/30 bg-supports/10 text-supports inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                      The Ithaca Standard
                    </span>
                    <Sparkles className="text-supports h-5 w-5" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">
                    The Epistemic Discourse Map
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    AI models parse scientific discourse into structured
                    argumentation semantics. Instantly trace consensus, locate
                    disputes, and understand methodological divergence.
                  </p>
                  <ul className="text-muted-foreground mt-auto space-y-3 text-sm">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="text-supports mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Real-time classification into Supports, Contradicts, and
                        Extends relationships.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="text-supports mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Direct citation text snippets and evidentiary reasoning
                        for every connection.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="text-supports mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Persistent, team-scoped graphs that compound knowledge
                        across entire research groups.
                      </span>
                    </li>
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EDGE TYPE VISUALIZATION ===== */}
      <section className="bg-muted/20 border-border/60 border-y py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <div className="mb-14 text-center">
                <span className="border-border bg-card text-muted-foreground mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                  ARGUMENTATION TAXONOMY
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                  Three relationships that unlock the conversation
                </h2>
                <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-base">
                  Every edge in Ithaca represents a peer-reviewed scientific stance,
                  giving you instant clarity on how claims evolve.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Supports */}
              <Reveal delay={0.1}>
                <div className="epistemic-card epistemic-card-supports border-border/80 bg-card flex h-full flex-col rounded-2xl border p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="bg-supports/15 text-supports flex h-12 w-12 items-center justify-center rounded-xl font-bold">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <span className="border-supports/30 bg-supports/10 text-supports rounded-full border px-2.5 py-0.5 text-xs font-bold">
                      SUPPORTS
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Supports</h3>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    Papers providing confirming empirical evidence, replicated
                    findings, or theoretical validation of a preceding hypothesis.
                  </p>
                  <div className="border-border/60 bg-muted/40 mt-auto rounded-xl border p-3 text-xs">
                    <p className="text-muted-foreground font-mono">
                      <strong className="text-foreground">Przybylski 2019</strong>{" "}
                      <span className="text-supports">supports</span>{" "}
                      <strong className="text-foreground">Orben 2019</strong>
                    </p>
                    <p className="text-muted-foreground mt-1 italic">
                      “Confirms minimal negative effect size across independent cohorts.”
                    </p>
                  </div>
                </div>
              </Reveal>

              {/* Contradicts */}
              <Reveal delay={0.2}>
                <div className="epistemic-card epistemic-card-contradicts border-border/80 bg-card flex h-full flex-col rounded-2xl border p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="bg-contradicts/15 text-contradicts flex h-12 w-12 items-center justify-center rounded-xl font-bold">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <span className="border-contradicts/30 bg-contradicts/10 text-contradicts rounded-full border px-2.5 py-0.5 text-xs font-bold">
                      CONTRADICTS
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Contradicts</h3>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    Papers challenging prior findings, presenting conflicting
                    measurements, or pinpointing methodological flaws in prior studies.
                  </p>
                  <div className="border-border/60 bg-muted/40 mt-auto rounded-xl border p-3 text-xs">
                    <p className="text-muted-foreground font-mono">
                      <strong className="text-foreground">Przybylski 2019</strong>{" "}
                      <span className="text-contradicts">contradicts</span>{" "}
                      <strong className="text-foreground">Twenge 2018</strong>
                    </p>
                    <p className="text-muted-foreground mt-1 italic">
                      “Methodological dispute over specification curve analysis.”
                    </p>
                  </div>
                </div>
              </Reveal>

              {/* Extends */}
              <Reveal delay={0.3}>
                <div className="epistemic-card epistemic-card-extends border-border/80 bg-card flex h-full flex-col rounded-2xl border p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="bg-extends/15 text-extends flex h-12 w-12 items-center justify-center rounded-xl font-bold">
                      <GitFork className="h-6 w-6" />
                    </div>
                    <span className="border-extends/30 bg-extends/10 text-extends rounded-full border px-2.5 py-0.5 text-xs font-bold">
                      EXTENDS
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Extends</h3>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    Papers generalizing previous models, expanding experimental
                    paradigms to new domains, or building on foundational protocols.
                  </p>
                  <div className="border-border/60 bg-muted/40 mt-auto rounded-xl border p-3 text-xs">
                    <p className="text-muted-foreground font-mono">
                      <strong className="text-foreground">Schaeffer 2023</strong>{" "}
                      <span className="text-extends">extends</span>{" "}
                      <strong className="text-foreground">Wei 2022</strong>
                    </p>
                    <p className="text-muted-foreground mt-1 italic">
                      “Re-evaluates scaling laws with continuous metric resolutions.”
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <div className="mb-16 text-center">
                <span className="border-border bg-muted/50 text-muted-foreground mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                  STREAMLINED WORKFLOW
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                  How Ithaca accelerates discovery
                </h2>
                <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                  From initial curiosity to high-confidence literature synthesis in three steps
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <Reveal key={step.step} delay={index * 0.1}>
                  <div className="border-border/80 bg-card relative flex h-full flex-col rounded-3xl border p-8 shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg">
                    {/* Step number badge */}
                    <div className="bg-primary text-primary-foreground absolute -top-4 -left-4 flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black shadow-md">
                      {step.step}
                    </div>

                    {/* Icon */}
                    <div className="bg-primary/10 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl">
                      <step.icon className="text-primary h-7 w-7" />
                    </div>

                    <h3 className="mb-3 text-xl font-bold">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>

                    {/* Connector line (except last) */}
                    {index < STEPS.length - 1 && (
                      <div className="border-border absolute top-1/2 -right-4 hidden w-8 border-t-2 border-dashed md:block" />
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section className="bg-muted/20 border-border/60 border-y py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="mb-16 text-center">
                <span className="border-border bg-card text-muted-foreground mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                  ENTERPRISE-GRADE CAPABILITIES
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                  Everything you need to navigate research
                </h2>
                <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                  Engineered specifically for academic labs, principal investigators, and PhD researchers
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={index * 0.05}>
                  <div className="border-border/80 bg-card flex h-full flex-col rounded-2xl border p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg">
                    <div
                      className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${feature.badgeColor}`}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRODUCT DEMO / CANVAS FRAME ===== */}
      <section id="demo" className="scroll-mt-24 py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <div className="mb-12 text-center">
                <span className="border-border bg-muted/50 text-muted-foreground mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                  LIVE INTERACTIVE DEMO
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                  See Ithaca in action
                </h2>
                <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                  Watch our epistemological engine unpack complex research controversies in real time
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              {/* Sleek MacOS / Research Workstation Window Frame */}
              <div className="demo-window-frame border-border/80 bg-card relative overflow-hidden rounded-2xl border">
                {/* Window Chrome Header Bar */}
                <div className="border-border/60 bg-muted/40 flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="border-border/50 bg-background/80 text-muted-foreground flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-mono">
                    <Search className="h-3 w-3" />
                    <span className="hidden sm:inline">ithaca.app/canvas/screen-time-development</span>
                    <span className="sm:hidden">ithaca.app/canvas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="bg-supports absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                      <span className="bg-supports relative inline-flex h-2 w-2 rounded-full" />
                    </span>
                    <span className="text-muted-foreground text-xs font-medium">Live Canvas</span>
                  </div>
                </div>

                {/* Animated product demo inside */}
                <div className="relative">
                  <AnimatedDemo />
                </div>
              </div>

              {/* CTA below demo */}
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="gap-2 px-8"
                  onClick={() => setShowSignIn(true)}
                >
                  Explore This Graph Live
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="gap-2"
                >
                  <Link href="/docs">
                    Read Methodology
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== USE CASES ===== */}
      <section className="bg-muted/20 border-border/60 border-y py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <div className="mb-16 text-center">
                <span className="border-border bg-card text-muted-foreground mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                  TAILORED FOR ACADEMIA
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                  Built for every stage of scientific inquiry
                </h2>
                <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                  Whether formulating your first dissertation proposal or running an international lab
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {USE_CASES.map((useCase, index) => (
                <Reveal key={useCase.title} delay={index * 0.1}>
                  <div className="border-border/80 bg-card flex h-full flex-col rounded-3xl border p-8 shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-2xl">
                        <useCase.icon className="text-primary h-7 w-7" />
                      </div>
                      <span className="border-border bg-muted/60 text-muted-foreground rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider">
                        {useCase.badge}
                      </span>
                    </div>
                    <h3 className="mb-3 text-xl font-bold">{useCase.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {useCase.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <Reveal>
              <span className="border-border bg-muted/50 text-muted-foreground mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                TRANSPARENT SUBSCRIPTION TIERS
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                Plans that match how research teams work
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Start free as an individual researcher. Upgrade to Lab or
                Institution when your research team requires shared workspaces,
                domain-gated invites, and unified AI compute.
              </p>
            </Reveal>
          </div>

          <Stagger className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {(
              [
                PLAN_ENTITLEMENTS.SOLO,
                PLAN_ENTITLEMENTS.LAB,
                PLAN_ENTITLEMENTS.INSTITUTION,
              ] as const
            ).map((plan) => {
              const isLab = plan.id === "LAB";
              return (
                <StaggerItem key={plan.id}>
                  <div
                    className={`bg-card relative flex h-full flex-col rounded-3xl border p-8 transition-all hover:shadow-xl ${
                      isLab
                        ? "border-primary/50 ring-primary/20 shadow-primary/5 ring-2 shadow-xl md:-translate-y-2"
                        : "border-border/80 shadow-xs"
                    }`}
                  >
                    {isLab && (
                      <div className="bg-primary text-primary-foreground absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold tracking-wider uppercase shadow-sm">
                        RECOMMENDED FOR LABS
                      </div>
                    )}

                    <div className="mb-6">
                      <p className="text-xs font-bold tracking-wider uppercase">
                        {plan.label}
                      </p>
                      <p className="mt-2 text-3xl font-black">{plan.priceLabel}</p>
                      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    <div className="via-border/60 my-2 h-px bg-gradient-to-r from-transparent to-transparent" />

                    <ul className="text-muted-foreground mb-8 flex-1 space-y-3 pt-4 text-sm">
                      <li className="flex gap-2.5">
                        <CheckCircle2 className="text-supports mt-0.5 h-4 w-4 shrink-0" />
                        <span>Up to {plan.maxMembers} team seats</span>
                      </li>
                      <li className="flex gap-2.5">
                        <CheckCircle2 className="text-supports mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          {plan.collaborativeWorkspaces
                            ? "Shared lab workspaces"
                            : "Personal researcher workspace"}
                        </span>
                      </li>
                      <li className="flex gap-2.5">
                        <CheckCircle2 className="text-supports mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          {plan.domainAllowlist
                            ? "Auto-join with university domain"
                            : "Standard email invitations"}
                        </span>
                      </li>
                      <li className="flex gap-2.5">
                        <CheckCircle2 className="text-supports mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          {plan.maxAiRequests.toLocaleString()} AI inference units / mo
                        </span>
                      </li>
                      {plan.id === "INSTITUTION" && (
                        <li className="flex gap-2.5">
                          <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                          <span>SSO / SAML university directory integration</span>
                        </li>
                      )}
                    </ul>

                    {plan.id === "SOLO" ? (
                      <Button
                        className="w-full gap-2 shadow-xs"
                        onClick={() => setShowSignIn(true)}
                      >
                        Create Free Account
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : plan.id === "LAB" ? (
                      <Button
                        className="shadow-primary/20 w-full gap-2 shadow-md"
                        onClick={() => setShowSignIn(true)}
                      >
                        Start Lab Plan
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" asChild className="w-full">
                        <Link href="/docs">Contact Institutional Sales</Link>
                      </Button>
                    )}
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ===== FOUNDER TRUST / BUILT BY RHIZAN ===== */}
      <section className="border-border/60 bg-muted/20 border-t py-16">
        <div className="container mx-auto px-4">
          <div className="border-border/80 bg-card/80 mx-auto max-w-4xl rounded-2xl border p-8 shadow-xs backdrop-blur-sm">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                <div className="flex -space-x-3 overflow-hidden">
                  <div className="border-background relative h-14 w-14 overflow-hidden rounded-full border-2 shadow-sm">
                    <Image
                      src="/founders/abdulaziz_circle.png"
                      alt="Abdulaziz Isa — Technical & AI Lead"
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="border-background relative h-14 w-14 overflow-hidden rounded-full border-2 shadow-sm">
                    <Image
                      src="/founders/nebiyu_circle.png"
                      alt="Nebiyu Musbah — Business & Growth Lead"
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="border-background relative h-14 w-14 overflow-hidden rounded-full border-2 shadow-sm">
                    <Image
                      src="/founders/sadam_circle.png"
                      alt="Sadam Hussen — Operations & Finance Lead"
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Engineered by Rhizan Tech
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Epistemic Graph Intelligence • Built for researchers &
                    laboratories worldwide
                  </p>
                </div>
              </div>
              <Link href="/about">
                <Button variant="outline" size="sm" className="gap-2">
                  Meet the Founders
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="hero-bg">
            <div className="blob blob--primary" />
          </div>
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Reveal>
              <h2 className="mb-6 text-3xl font-extrabold tracking-tight md:text-5xl">
                Ready to see scientific research differently?
              </h2>
              <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
                Join researchers using Ithaca to map consensus, uncover debates,
                and discover breakthroughs.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="shadow-primary/20 gap-2 px-10 text-lg shadow-lg"
                  onClick={() => setShowSignIn(true)}
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== AUTH DIALOGS ===== */}
      <SignInDialog open={showSignIn} onOpenChange={setShowSignIn} />
      <OnboardingDialog
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
