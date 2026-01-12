"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { OnboardingDialog } from "@/components/auth/onboarding-dialog";
// Note: Header and Footer provided by (public)/layout.tsx

export default function LandingPage() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // TODO: Update user's hasCompletedOnboarding flag
  };

  return (
    <div className="bg-background text-foreground">
      {/* Main Content */}
      <div className="mx-auto">
        <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-6 pt-8 pb-8">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-primary">
              Scientific Argument <br className="hidden md:block" /> Graph Explorer
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Explore scientific debates through interactive argument graphs.
              Visualize how papers support, contradict, or extend each other.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button size="lg" onClick={() => setShowSignIn(true)} className="h-12 px-8 text-lg font-bold shadow-lg shadow-primary/20">
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => setShowOnboarding(true)} className="h-12 px-8 text-lg">
                View Tutorial
              </Button>
            </div>
          </section>

          {/* Design Tokens Demo / Graph Viz */}
          <section className="space-y-8 pt-8">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold">Visual Grammar</h3>
              <p className="text-muted-foreground">Understand the language of citation networks</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Supports */}
              <div className="p-8 rounded-2xl border border-border bg-card/50 hover:bg-card hover:shadow-xl transition-all duration-300 group">
                <div className="w-16 h-16 rounded-full bg-supports/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <div className="w-8 h-8 rounded-full bg-supports"></div>
                </div>
                <h4 className="text-xl font-bold mb-3 text-supports">Supports</h4>
                <p className="text-muted-foreground">
                  Papers that provide supporting evidence or replicate findings
                </p>
              </div>

              {/* Contradicts */}
              <div className="p-8 rounded-2xl border border-border bg-card/50 hover:bg-card hover:shadow-xl transition-all duration-300 group">
                <div className="w-16 h-16 rounded-full bg-contradicts/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <div className="w-8 h-8 rounded-full bg-contradicts"></div>
                </div>
                <h4 className="text-xl font-bold mb-3 text-contradicts">Contradicts</h4>
                <p className="text-muted-foreground">
                  Papers that present conflicting findings or refute claims
                </p>
              </div>

              {/* Extends */}
              <div className="p-8 rounded-2xl border border-border bg-card/50 hover:bg-card hover:shadow-xl transition-all duration-300 group">
                <div className="w-16 h-16 rounded-full bg-extends/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <div className="w-8 h-8 rounded-full bg-extends"></div>
                </div>
                <h4 className="text-xl font-bold mb-3 text-extends">Extends</h4>
                <p className="text-muted-foreground">
                  Papers that build upon previous work or apply methods to new domains
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="space-y-8 pt-12">
            <h3 className="text-3xl font-bold text-center">Powerful Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <div className="size-8 rounded bg-orcid/10 flex items-center justify-center">
                    <svg className="size-4 text-orcid" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947a.95.95 0 01-.947.947.95.95 0 01-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.016-5.325 5.016h-3.919V7.416z"/>
                    </svg>
                  </div>
                  ORCID Integration
                </h4>
                <p className="text-sm text-muted-foreground">
                  Sign in with your ORCID iD for seamless researcher authentication and profile syncing.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
                <h4 className="font-bold text-lg mb-2">Interactive Graphs</h4>
                <p className="text-sm text-muted-foreground">
                  Explore citation networks with intuitive pan, zoom, and filtering controls powered by WebGL.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
                <h4 className="font-bold text-lg mb-2">Real-time Collaboration</h4>
                <p className="text-sm text-muted-foreground">
                  Share and collaborate on research networks with your team in real-time.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
                <h4 className="font-bold text-lg mb-2">Dark Mode</h4>
                <p className="text-sm text-muted-foreground">
                  Beautiful, eye-saving interface optimized for late-night research sessions.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

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
