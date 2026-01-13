"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { OnboardingDialog } from "@/components/auth/onboarding-dialog";
import { Menu, X } from "lucide-react";

export default function Home() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background absolute left-0 right-0 p-4 shadow-lg animate-in slide-in-from-top-5">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/about" 
                className="px-4 py-2 hover:bg-muted rounded-md text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/blog" 
                className="px-4 py-2 hover:bg-muted rounded-md text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link 
                href="/docs" 
                className="px-4 py-2 hover:bg-muted rounded-md text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
              <Link 
                href="/roadmap" 
                className="px-4 py-2 hover:bg-muted rounded-md text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Roadmap
              </Link>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => { setMobileMenuOpen(false); setShowOnboarding(true); }}
              >
                Tutorial
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">
              Scientific Argument Graph Explorer
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore scientific debates through interactive argument graphs.
              Visualize how papers support, contradict, or extend each other.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" onClick={() => setShowSignIn(true)}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => setShowOnboarding(true)}>
                Learn More
              </Button>
            </div>
          </section>

          {/* Design Tokens Demo */}
          <section className="space-y-6">
            <h3 className="text-3xl font-semibold">Graph Visualization</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Supports */}
              <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-full bg-supports mb-4"></div>
                <h4 className="font-semibold mb-2">Supports</h4>
                <p className="text-sm text-muted-foreground">
                  Papers that provide supporting evidence
                </p>
              </div>

              {/* Contradicts */}
              <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-full bg-contradicts mb-4"></div>
                <h4 className="font-semibold mb-2">Contradicts</h4>
                <p className="text-sm text-muted-foreground">
                  Papers that present conflicting findings
                </p>
              </div>

              {/* Extends */}
              <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-full bg-extends mb-4"></div>
                <h4 className="font-semibold mb-2">Extends</h4>
                <p className="text-sm text-muted-foreground">
                  Papers that build upon previous work
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="space-y-6">
            <h3 className="text-3xl font-semibold">Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-border bg-card">
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

              <div className="p-6 rounded-lg border border-border bg-card">
                <h4 className="font-semibold mb-2">Interactive Graphs</h4>
                <p className="text-sm text-muted-foreground">
                  Explore citation networks with intuitive pan, zoom, and filtering
                </p>
              </div>

              <div className="p-6 rounded-lg border border-border bg-card">
                <h4 className="font-semibold mb-2">Real-time Collaboration</h4>
                <p className="text-sm text-muted-foreground">
                  Share and collaborate on research networks with your team
                </p>
              </div>

              <div className="p-6 rounded-lg border border-border bg-card">
                <h4 className="font-semibold mb-2">Dark Mode</h4>
                <p className="text-sm text-muted-foreground">
                  Beautiful interface in both light and dark themes
                </p>
              </div>
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
