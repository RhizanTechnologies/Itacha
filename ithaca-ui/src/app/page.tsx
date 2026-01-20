"use client";

import { useState } from "react";
import { useAnimationPause } from "@/hooks/useAnimationPause";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { OnboardingDialog } from "@/components/auth/onboarding-dialog";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { GraphConstellation } from "@/components/visual/graph-constellation";

export default function Home() {
  useAnimationPause();
  
  const [showSignIn, setShowSignIn] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // TODO: Update user's hasCompletedOnboarding flag
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with Theme Toggle and Nav */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-40">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg
                className="size-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Ithaca</h1>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Blog
            </Link>
            <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link href="/roadmap" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Roadmap
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowOnboarding(true)} className="hidden sm:inline-flex">
              Tutorial
            </Button>
            <Button onClick={() => setShowSignIn(true)}>Sign In</Button>
            <ThemeToggle />
            
            {/* Mobile Menu Trigger */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-nav"
              className="md:hidden border-t border-border bg-background absolute left-0 right-0 p-4 shadow-lg"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.12 }
                  : { type: "spring", stiffness: 420, damping: 34 }
              }
            >
              <motion.nav
                className="flex flex-col space-y-2"
                initial={shouldReduceMotion ? false : "hidden"}
                animate={shouldReduceMotion ? undefined : "show"}
                variants={
                  shouldReduceMotion
                    ? undefined
                    : {
                        hidden: {},
                        show: { transition: { staggerChildren: 0.06 } },
                      }
                }
              >
                {[
                  { href: "/about", label: "About" },
                  { href: "/blog", label: "Blog" },
                  { href: "/docs", label: "Docs" },
                  { href: "/roadmap", label: "Roadmap" },
                ].map((item) => (
                  <motion.div
                    key={item.href}
                    variants={
                      shouldReduceMotion
                        ? undefined
                        : {
                            hidden: { opacity: 0, y: -6 },
                            show: { opacity: 1, y: 0 },
                          }
                    }
                  >
                    <Link
                      href={item.href}
                      className="px-4 py-2 hover:bg-muted rounded-md text-sm font-medium transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  variants={
                    shouldReduceMotion
                      ? undefined
                      : {
                          hidden: { opacity: 0, y: -6 },
                          show: { opacity: 1, y: 0 },
                        }
                  }
                >
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowOnboarding(true);
                    }}
                  >
                    Tutorial
                  </Button>
                </motion.div>
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main id="content" role="main" className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section - OPTIMIZED for scroll performance */}
          <section className="relative text-center overflow-hidden rounded-3xl border border-border bg-card/40 p-8 md:p-12 shadow-sm" style={{ contain: "layout style paint" }}>
            <div aria-hidden className="hero-bg pointer-events-none">
              <div className="blob bg-primary/30"></div>
              <div className="blob bg-accent/20"></div>
            </div>
            <GraphConstellation className="opacity-55" />

            <Stagger className="hero-layer space-y-6">
              <StaggerItem>
                <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                  A map of scientific debate — not just citations
                </p>
              </StaggerItem>

              <StaggerItem>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Scientific Argument Graph Explorer
                  </span>
                </h2>
              </StaggerItem>

              <StaggerItem>
                <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Enter a new field faster: discover the foundational papers, the key disputes, and the strongest evidence — in one navigable graph.
                </p>
              </StaggerItem>

              <StaggerItem>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button
                    size="lg"
                    className="transition-transform active:scale-[0.98]"
                    onClick={() => setShowSignIn(true)}
                  >
                    Get Started
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="transition-transform active:scale-[0.98]"
                    onClick={() => setShowOnboarding(true)}
                  >
                    Learn More
                  </Button>
                </div>
              </StaggerItem>
            </Stagger>
          </section>

          {/* Design Tokens Demo - OPTIMIZED */}
          <section className="space-y-6" style={{ contain: "layout style" }}>
            <Reveal>
              <h3 className="text-3xl font-semibold">Graph Visualization</h3>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Supports */}
              <Reveal delay={0.03}>
                <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-full bg-supports mb-4"></div>
                <h4 className="font-semibold mb-2">Supports</h4>
                <p className="text-sm text-muted-foreground">
                  Papers that provide supporting evidence
                </p>
                </div>
              </Reveal>

              {/* Contradicts */}
              <Reveal delay={0.06}>
                <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-full bg-contradicts mb-4"></div>
                <h4 className="font-semibold mb-2">Contradicts</h4>
                <p className="text-sm text-muted-foreground">
                  Papers that present conflicting findings
                </p>
                </div>
              </Reveal>

              {/* Extends */}
              <Reveal delay={0.09}>
                <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-full bg-extends mb-4"></div>
                <h4 className="font-semibold mb-2">Extends</h4>
                <p className="text-sm text-muted-foreground">
                  Papers that build upon previous work
                </p>
                </div>
              </Reveal>
            </div>
          </section>

          {/* Features - OPTIMIZED */}
          <section className="space-y-6" style={{ contain: "layout style" }}>
            <Reveal>
              <h3 className="text-3xl font-semibold">Features</h3>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Reveal delay={0.03}>
                <div className="p-6 rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <div className="size-8 rounded bg-orcid/10 flex items-center justify-center">
                      <svg className="size-4 text-orcid" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947a.95.95 0 01-.947.947.95.95 0 01-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.016-5.325 5.016h-3.919V7.416z"/>
                      </svg>
                    </div>
                    ORCID Integration
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Sign in with your ORCID iD for seamless researcher authentication
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.06}>
                <div className="p-6 rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
                  <h4 className="font-semibold mb-2">Interactive Graphs</h4>
                  <p className="text-sm text-muted-foreground">
                    Explore the argument landscape with intuitive pan, zoom, and filtering.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.09}>
                <div className="p-6 rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
                  <h4 className="font-semibold mb-2">Evidence-first Context</h4>
                  <p className="text-sm text-muted-foreground">
                    Inspect why the AI inferred a relationship with a confidence score and source excerpt.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.12}>
                <div className="p-6 rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
                  <h4 className="font-semibold mb-2">Dark Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    A comfortable, high-contrast interface in both light and dark themes.
                  </p>
                </div>
              </Reveal>
            </div>
          </section>
        </div>
      </main>

      {/* Auth Dialogs */}
      <SignInDialog open={showSignIn} onOpenChange={setShowSignIn} />
      <OnboardingDialog
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
