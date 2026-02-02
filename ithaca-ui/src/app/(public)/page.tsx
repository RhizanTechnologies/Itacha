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
  Quote,
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

// Mock data for testimonials
const TESTIMONIALS = [
  {
    quote:
      "Ithaca helped me identify the key debates in my field within a week. What used to take months of reading now takes hours.",
    author: "Dr. Sarah Chen",
    role: "Assistant Professor, Computational Biology",
    institution: "MIT",
    avatar: null,
  },
  {
    quote:
      "The argument visualization completely changed how I approach literature reviews. I can finally see the forest, not just the trees.",
    author: "James Okonkwo",
    role: "PhD Candidate, Machine Learning",
    institution: "Stanford University",
    avatar: null,
  },
  {
    quote:
      "For grant writing, being able to map the research landscape quickly is invaluable. Ithaca is now an essential part of my workflow.",
    author: "Prof. Maria Santos",
    role: "Research Director",
    institution: "Oxford University",
    avatar: null,
  },
];

// Features data
const FEATURES = [
  {
    icon: <div className="w-6 h-6 rounded-full bg-supports" />,
    title: "Argument Visualization",
    description:
      "See which papers support, contradict, or extend each other at a glance. No more guessing about research relationships.",
    color: "supports",
  },
  {
    icon: <FileText className="w-6 h-6 text-primary" />,
    title: "Evidence Citations",
    description:
      "Click any edge to see the exact passages that establish the relationship. Full transparency in every connection.",
    color: "primary",
  },
  {
    icon: <Sparkles className="w-6 h-6 text-accent-foreground" />,
    title: "AI Confidence Scores",
    description:
      "Every inferred relationship comes with a confidence score and reasoning. You always know why we made a connection.",
    color: "accent",
  },
  {
    icon: <MousePointerClick className="w-6 h-6 text-primary" />,
    title: "Interactive Exploration",
    description:
      "Pan, zoom, and filter with intuitive controls. Keyboard shortcuts for power users. Built for deep exploration.",
    color: "primary",
  },
  {
    icon: <Users className="w-6 h-6 text-primary" />,
    title: "Save & Collaborate",
    description:
      "Export graphs, save your explorations, and share with collaborators. Build a library of research landscapes.",
    color: "primary",
  },
  {
    icon: <Shield className="w-6 h-6 text-orcid" />,
    title: "ORCID Integration",
    description:
      "Sign in with your ORCID iD for seamless authentication. Your research identity, respected.",
    color: "orcid",
  },
];

// How it works steps
const STEPS = [
  {
    step: 1,
    title: "Search any topic",
    description:
      "Enter a research question, paper title, or field of study. Our AI indexes millions of papers.",
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

// Stat bar data
const STATS = [
  { value: "2M+", label: "Papers Indexed" },
  { value: "50+", label: "Institutions" },
  { value: "10K+", label: "Researchers" },
];

export default function Home() {
  useAnimationPause();

  const [showSignIn, setShowSignIn] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Elements */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="hero-bg">
            <div className="blob blob--primary" />
            <div className="blob blob--accent" />
          </div>
        </div>

        <GraphConstellation className="opacity-75" />

        <div className="container mx-auto px-4 relative z-10">
          <Stagger className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <StaggerItem>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-supports animate-pulse" />
                Beyond citations. Understand the debate.
              </span>
            </StaggerItem>

            {/* Main Headline */}
            <StaggerItem>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Navigate any research field in{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-chart-1 to-accent">
                  minutes, not months
                </span>
              </h1>
            </StaggerItem>

            {/* Subheadline */}
            <StaggerItem>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Ithaca maps how scientific papers support, contradict, and
                extend each other so you see the real conversation, not just
                references.
              </p>
            </StaggerItem>

            {/* CTAs */}
            <StaggerItem>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  className="text-base px-8 gap-2 transition-transform active:scale-[0.98]"
                  onClick={() => setShowSignIn(true)}
                >
                  Start Exploring Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 gap-2 transition-transform active:scale-[0.98]"
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="w-4 h-4" />
                  Watch Demo
                </Button>
              </div>
            </StaggerItem>

            {/* Trust note */}
            <StaggerItem>
              <p className="text-sm text-muted-foreground pt-4">
                Free for researchers. No credit card required.
              </p>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* ===== SOCIAL PROOF BAR ===== */}
      <section className="border-y border-border bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Stats */}
              <div className="flex items-center gap-8 md:gap-12">
                {STATS.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Institution logos placeholder */}
              <div className="flex items-center gap-6 opacity-60">
                <span className="text-sm text-muted-foreground">
                  Trusted by researchers at
                </span>
                <div className="flex items-center gap-4">
                  {["MIT", "Stanford", "Oxford", "ETH"].map((inst) => (
                    <span
                      key={inst}
                      className="text-sm font-semibold text-muted-foreground/80"
                    >
                      {inst}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== PROBLEM-AGITATION-SOLUTION ===== */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Stagger className="space-y-16">
              {/* Problem */}
              <StaggerItem>
                <div className="text-center space-y-4">
                  <span className="text-sm font-semibold uppercase tracking-wider text-contradicts">
                    The Problem
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold">
                    Entering a new research field takes months of reading
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                  <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
              </StaggerItem>

              {/* Solution */}
              <StaggerItem>
                <div className="text-center space-y-4">
                  <span className="text-sm font-semibold uppercase tracking-wider text-supports">
                    The Solution
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold">
                    See the scientific conversation, not just references
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Supports */}
              <div className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1 text-center">
                <div className="w-16 h-16 rounded-full bg-supports/20 flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 rounded-full bg-supports" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Supports</h3>
                <p className="text-sm text-muted-foreground">
                  Papers that provide confirming evidence or reinforce a claim
                </p>
              </div>

              {/* Contradicts */}
              <div className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1 text-center">
                <div className="w-16 h-16 rounded-full bg-contradicts/20 flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 rounded-full bg-contradicts" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Contradicts</h3>
                <p className="text-sm text-muted-foreground">
                  Papers that present conflicting findings or challenge
                  conclusions
                </p>
              </div>

              {/* Extends */}
              <div className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1 text-center">
                <div className="w-16 h-16 rounded-full bg-extends/20 flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 rounded-full bg-extends" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Extends</h3>
                <p className="text-sm text-muted-foreground">
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
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  How it works
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  From question to insight in three simple steps
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map((step, index) => (
                <Reveal key={step.step} delay={index * 0.1}>
                  <div className="relative p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all">
                    {/* Step number */}
                    <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                      {step.step}
                    </div>

                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                      <step.icon className="w-7 h-7 text-primary" />
                    </div>

                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>

                    {/* Connector line (except last) */}
                    {index < STEPS.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-border" />
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section className="py-24 md:py-32 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Everything you need to navigate research
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Powerful features designed for serious researchers
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={index * 0.05}>
                  <div className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
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
      <section id="demo" className="py-24 md:py-32 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  See Ithaca in action
                </h2>
                <p className="text-lg text-muted-foreground">
                  An interactive graph explorer built for researchers
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              {/* Animated product demo */}
              <div className="relative rounded-2xl border border-border overflow-hidden shadow-2xl">
                <AnimatedDemo />
                
                {/* Decorative corner badge */}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-medium backdrop-blur-sm text-slate-300">
                  Live Preview
                </div>
              </div>
              
              {/* CTA below demo */}
              <div className="text-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  Take the guided tour
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-24 md:py-32 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Loved by researchers worldwide
                </h2>
                <p className="text-lg text-muted-foreground">
                  See what the research community is saying
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((testimonial, index) => (
                <Reveal key={testimonial.author} delay={index * 0.1}>
                  <div className="p-8 rounded-2xl border border-border bg-card h-full flex flex-col">
                    <Quote className="w-8 h-8 text-primary/30 mb-4" />
                    <blockquote className="text-foreground leading-relaxed flex-1 mb-6">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center gap-4">
                      {/* Avatar placeholder */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg font-bold text-primary">
                        {testimonial.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {testimonial.author}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {testimonial.institution}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== USE CASES ===== */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Built for every stage of research
                </h2>
                <p className="text-lg text-muted-foreground">
                  From first-year PhD students to seasoned professors
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {USE_CASES.map((useCase, index) => (
                <Reveal key={useCase.title} delay={index * 0.1}>
                  <div className="text-center p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <useCase.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
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

      {/* ===== PRICING PREVIEW ===== */}
      <section className="py-24 md:py-32 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Reveal>
              <div className="p-12 rounded-3xl border border-border bg-card">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-supports/10 text-supports text-sm font-medium mb-6">
                  <CheckCircle2 className="w-4 h-4" />
                  Free for researchers
                </span>

                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Start exploring today
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  Ithaca is free for individual researchers. Sign in with your
                  ORCID or institutional email to get started.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={() => setShowSignIn(true)}
                  >
                    Create Free Account
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Link href="/docs">
                    <Button size="lg" variant="outline">
                      View Documentation
                    </Button>
                  </Link>
                </div>

                <p className="text-sm text-muted-foreground mt-6">
                  Institutional and team plans coming soon
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to see research differently?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of researchers who are navigating scientific
                debates faster than ever.
              </p>
              <Button
                size="lg"
                className="text-lg px-10 gap-2"
                onClick={() => setShowSignIn(true)}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
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
