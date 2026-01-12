import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Target, Users, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="border-b border-border bg-muted/20">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            We're mapping the world's <br className="hidden md:block" /> scientific knowledge.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Ithaca is building the most intuitive interface for exploring scientific debates. 
            We help researchers navigate the complex web of citations, contradictions, and consensus.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wide">
              <Target className="h-4 w-4" />
              Our Mission
            </div>
            <h2 className="text-3xl font-bold">Accelerating discovery by connecting the dots.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Scientific knowledge is fragmented across millions of static PDFs. 
              Researchers spend countless hours tracing citations and reconstructing the history of ideas manually.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We believe that by visualizing the relationships between papers—who contradicted whom, 
              who supported whom—we can make the scientific process transparent and accessible to everyone.
            </p>
          </div>
          <div className="relative aspect-square md:aspect-auto md:h-[500px] bg-muted rounded-2xl overflow-hidden border border-border">
            {/* Placeholder for About Us Image */}
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium">Team Photo / Office Shot</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">How we build</h2>
            <p className="text-muted-foreground text-lg">
              Our principles guide every decision we make, from database architecture to pixel-perfect UI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-background rounded-xl border border-border shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Speed matters</h3>
              <p className="text-muted-foreground">
                Research is hard enough. Your tools shouldn't slow you down. We obsess over milliseconds.
              </p>
            </div>
            
             <div className="p-8 bg-background rounded-xl border border-border shadow-sm">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Truth over vanity</h3>
              <p className="text-muted-foreground">
                We prioritize accuracy and data integrity over flashy features. What you see is cited fact.
              </p>
            </div>

            <div className="p-8 bg-background rounded-xl border border-border shadow-sm">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Open by default</h3>
              <p className="text-muted-foreground">
                Science thrives in the open. We build focused on open access and transparent methodologies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to explore?</h2>
        <div className="flex justify-center gap-4">
           <Link href="/">
            <Button size="lg" className="h-12 px-8">
              Start Exploring
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/blog">
            <Button size="lg" variant="outline" className="h-12 px-8">
              Read the Blog
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
