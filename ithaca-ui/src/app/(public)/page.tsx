"use client";

import { useState } from "react";
import { useAnimationPause } from "@/hooks/useAnimationPause";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { GraphConstellation } from "@/components/visual/graph-constellation";
import { AnimatedDemo } from "@/components/landing/animated-demo";
import { PLAN_ENTITLEMENTS } from "@/lib/platform/org-plans";

// Features data
const FEATURES = [
  {
    icon: <div className="bg-supports h-6 w-6 rounded-full" />,
    title: "Argument Visualization",
    description:
      "See which papers support, contradict, or extend each other at a glance. No more guessing about research relationships.",
    color: "supports",
  },
  {
    icon: <FileText className="text-primary h-6 w-6" />,
    title: "Evidence Citations",
    description:
      "Click any edge to see the exact passages that establish the relationship. Full transparency in every connection.",
    color: "primary",
  },
  {
    icon: <Sparkles className="text-accent-foreground h-6 w-6" />,
    title: "AI Confidence Scores",
    description:
      "Every inferred relationship comes with a confidence score and reasoning. You always know why we made a connection.",
    color: "accent",
  },
  {
    icon: <MousePointerClick className="text-primary h-6 w-6" />,
    title: "Interactive Exploration",
    description:
      "Pan, zoom, and filter with intuitive controls. Keyboard shortcuts for power users. Built for deep exploration.",
    color: "primary",
  },
  {
    icon: <Users className="text-primary h-6 w-6" />,
    title: "Save & Collaborate",
    description:
      "Export graphs, save your explorations, and share with collaborators. Build a library of research landscapes.",
    color: "primary",
  },
  {
    icon: <Shield className="text-primary h-6 w-6" />,
    title: "Team workspaces",
    description:
      "Invite lab members, assign roles, and keep projects scoped to your organization.",
    color: "primary",
  },
];

// How it works steps
const STEPS = [
  {
    step: 1,
    title: "Search any topic",
    description: "Enter a research question, paper title, or field of study.",
    icon: Search,
  },
  {
    step: 2,
    title: "Explore the graph",
    description:
      "Navigate an interactive visualization showing how papers relate through argumentation.",
    icon: MousePointerClick,
  },
  {
    step: 3,
    title: "Discover insights",
    description:
      "Identify key debates, foundational papers, and emerging research directions in minutes.",
    icon: Lightbulb,
  },
];

// Use cases
const USE_CASES = [
  {
    icon: GraduationCap,
    title: "PhD Students",
    description:
      "Enter a new research field faster. Understand the foundational debates before diving into specifics.",
  },
  {
    icon: Users,
    title: "Research Teams",
    description:
      "Accelerate literature reviews. Map the landscape collaboratively and identify gaps in existing research.",
  },
  {
    icon: BookOpen,
    title: "Grant Writers",
    description:
      "Visualize where your proposed research fits. Demonstrate novelty with clear relationship mapping.",
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
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
        {/* Background Elements */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="from-primary/5 absolute inset-0 bg-gradient-to-b via-transparent to-transparent" />
          <div className="hero-bg">
            <div className="blob blob--primary" />
            <div className="blob blob--accent" />
          </div>
        </div>

        <GraphConstellation className="opacity-75" />

        <div className="relative z-10 container mx-auto px-4">
          <Stagger className="mx-auto max-w-4xl space-y-8 text-center">
            {/* Badge */}
            <StaggerItem>
              <span className="border-border bg-background/80 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                <span className="bg-supports h-2 w-2 animate-pulse rounded-full" />
                Beyond citations. Understand the debate.
              </span>
            </StaggerItem>

            {/* Main Headline */}
            <StaggerItem>
              <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Navigate any research field in{" "}
                <span className="from-primary via-chart-1 to-accent bg-gradient-to-r bg-clip-text text-transparent">
                  minutes, not months
                </span>
              </h1>
            </StaggerItem>

            {/* Subheadline */}
            <StaggerItem>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed md:text-xl">
                Ithaca maps how scientific papers support, contradict, and
                extend each other so you see the real conversation, not just
                references.
              </p>
            </StaggerItem>

            {/* CTAs */}
            <StaggerItem>
              <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
                <Button
                  size="lg"
                  className="gap-2 px-8 text-base transition-transform active:scale-[0.98]"
                  onClick={() => setShowSignIn(true)}
                >
                  Start Exploring Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 px-8 text-base transition-transform active:scale-[0.98]"
                  onClick={() =>
                    document
                      .getElementById("demo")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <Play className="h-4 w-4" />
                  Watch Demo
                </Button>
              </div>
            </StaggerItem>

            {/* Trust note */}
            <StaggerItem>
              <p className="text-muted-foreground pt-4 text-sm">
                Free for researchers. No credit card required.
              </p>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* ===== EARLY ACCESS NOTE ===== */}
      <section className="border-border bg-muted/30 border-y py-8">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="flex flex-col items-center justify-center gap-4 text-center md:flex-row">
              <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
                <span className="bg-supports h-2 w-2 rounded-full" />
                Ithaca is in early development. We&apos;re building in public
                and growing feature by feature.
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== PROBLEM-AGITATION-SOLUTION ===== */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <Stagger className="space-y-16">
              {/* Problem */}
              <StaggerItem>
                <div className="space-y-4 text-center">
                  <span className="text-contradicts text-sm font-semibold tracking-wider uppercase">
                    The Problem
                  </span>
                  <h2 className="text-3xl font-bold md:text-4xl">
                    Entering a new research field takes months of reading
                  </h2>
                  <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                    Every PhD student knows the pain. Hundreds of papers,
                    tangled citation networks, and no clear map of what actually
                    matters. Citation counts tell you what's popular not what's
                    true.
                  </p>
                </div>
              </StaggerItem>

              {/* Visual divider */}
              <StaggerItem>
                <div className="flex items-center justify-center gap-4">
                  <div className="via-border h-px flex-1 bg-gradient-to-r from-transparent to-transparent" />
                  <ArrowRight className="text-muted-foreground h-6 w-6" />
                  <div className="via-border h-px flex-1 bg-gradient-to-r from-transparent to-transparent" />
                </div>
              </StaggerItem>

              {/* Solution */}
              <StaggerItem>
                <div className="space-y-4 text-center">
                  <span className="text-supports text-sm font-semibold tracking-wider uppercase">
                    The Solution
                  </span>
                  <h2 className="text-3xl font-bold md:text-4xl">
                    See the scientific conversation, not just references
                  </h2>
                  <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                    Ithaca uses AI to identify argumentation relationships:
                    which papers support a claim, which contradict it, and which
                    extend the methodology. The result? A navigable map of
                    scientific debate.
                  </p>
                </div>
              </StaggerItem>
            </Stagger>
          </div>
        </div>
      </section>

      {/* ===== EDGE TYPE VISUALIZATION ===== */}
      <section className="bg-muted/20 py-16">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
              {/* Supports */}
              <div className="border-border bg-card rounded-2xl border p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="bg-supports/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <div className="bg-supports h-8 w-8 rounded-full" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Supports</h3>
                <p className="text-muted-foreground text-sm">
                  Papers that provide confirming evidence or reinforce a claim
                </p>
              </div>

              {/* Contradicts */}
              <div className="border-border bg-card rounded-2xl border p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="bg-contradicts/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <div className="bg-contradicts h-8 w-8 rounded-full" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Contradicts</h3>
                <p className="text-muted-foreground text-sm">
                  Papers that present conflicting findings or challenge
                  conclusions
                </p>
              </div>

              {/* Extends */}
              <div className="border-border bg-card rounded-2xl border p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="bg-extends/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <div className="bg-extends h-8 w-8 rounded-full" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Extends</h3>
                <p className="text-muted-foreground text-sm">
                  Papers that build upon and expand previous methodologies
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                  How it works
                </h2>
                <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                  From question to insight in three simple steps
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <Reveal key={step.step} delay={index * 0.1}>
                  <div className="border-border bg-card relative rounded-2xl border p-8 transition-all hover:shadow-lg">
                    {/* Step number */}
                    <div className="bg-primary text-primary-foreground absolute -top-4 -left-4 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold">
                      {step.step}
                    </div>

                    {/* Icon */}
                    <div className="bg-primary/10 mb-6 flex h-14 w-14 items-center justify-center rounded-xl">
                      <step.icon className="text-primary h-7 w-7" />
                    </div>

                    <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>

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
      <section className="bg-muted/20 py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                  Everything you need to navigate research
                </h2>
                <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                  Powerful features designed for serious researchers
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={index * 0.05}>
                  <div className="border-border bg-card h-full rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
                    <div className="bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                      {feature.title}
                    </h3>
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

      {/* ===== PRODUCT DEMO / SCREENSHOT ===== */}
      <section id="demo" className="scroll-mt-20 py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                  See Ithaca in action
                </h2>
                <p className="text-muted-foreground text-lg">
                  An interactive graph explorer built for researchers
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              {/* Animated product demo */}
              <div className="border-border relative overflow-hidden rounded-2xl border shadow-2xl">
                <AnimatedDemo />

                {/* Decorative corner badge */}
                <div className="absolute top-4 left-4 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-sm">
                  Live Preview
                </div>
              </div>

              {/* CTA below demo */}
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() =>
                    document
                      .getElementById("demo")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Take the guided tour
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== USE CASES ===== */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                  Built for every stage of research
                </h2>
                <p className="text-muted-foreground text-lg">
                  From first-year PhD students to seasoned professors
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {USE_CASES.map((useCase, index) => (
                <Reveal key={useCase.title} delay={index * 0.1}>
                  <div className="border-border bg-card rounded-2xl border p-8 text-center transition-all hover:shadow-lg">
                    <div className="bg-primary/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
                      <useCase.icon className="text-primary h-8 w-8" />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold">
                      {useCase.title}
                    </h3>
                    <p className="text-muted-foreground">
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
      <section className="bg-muted/20 py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Reveal>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Plans that match how labs work
              </h2>
              <p className="text-muted-foreground text-lg">
                Start free as Solo. Upgrade to Lab or Institution when your team
                needs shared seats, collaboration, and domain-gated invites.
              </p>
            </Reveal>
          </div>

          <Stagger className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {(
              [
                PLAN_ENTITLEMENTS.SOLO,
                PLAN_ENTITLEMENTS.LAB,
                PLAN_ENTITLEMENTS.INSTITUTION,
              ] as const
            ).map((plan) => (
              <StaggerItem key={plan.id}>
                <div
                  className={`border-border bg-card flex h-full flex-col rounded-3xl border p-8 ${
                    plan.id === "LAB" ? "ring-primary/30 ring-2" : ""
                  }`}
                >
                  <div className="mb-6">
                    <p className="text-sm font-medium tracking-wide uppercase">
                      {plan.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold">{plan.priceLabel}</p>
                    <p className="text-muted-foreground mt-3 text-sm">
                      {plan.description}
                    </p>
                  </div>
                  <ul className="text-muted-foreground mb-8 flex-1 space-y-2 text-sm">
                    <li className="flex gap-2">
                      <CheckCircle2 className="text-supports mt-0.5 h-4 w-4 shrink-0" />
                      Up to {plan.maxMembers} seats
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="text-supports mt-0.5 h-4 w-4 shrink-0" />
                      {plan.collaborativeWorkspaces
                        ? "Collaborative workspaces"
                        : "Personal workspace"}
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="text-supports mt-0.5 h-4 w-4 shrink-0" />
                      {plan.domainAllowlist
                        ? "Domain-gated invites"
                        : "Invite by email"}
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="text-supports mt-0.5 h-4 w-4 shrink-0" />
                      {plan.maxAiRequests.toLocaleString()} AI units / month
                    </li>
                    {plan.id === "INSTITUTION" && (
                      <li className="flex gap-2">
                        <CheckCircle2 className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                        SSO / SAML upcoming for pilots
                      </li>
                    )}
                  </ul>
                  {plan.id === "SOLO" ? (
                    <Button
                      className="w-full gap-2"
                      onClick={() => setShowSignIn(true)}
                    >
                      Create free account
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Link href="/docs" className="block w-full">
                      <Button variant="outline" className="w-full">
                        Contact for pilot
                      </Button>
                    </Link>
                  )}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Reveal>
              <h2 className="mb-6 text-3xl font-bold md:text-5xl">
                Ready to see research differently?
              </h2>
              <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
                Start navigating scientific debates with argumentation-aware
                graph exploration.
              </p>
              <Button
                size="lg"
                className="gap-2 px-10 text-lg"
                onClick={() => setShowSignIn(true)}
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
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
