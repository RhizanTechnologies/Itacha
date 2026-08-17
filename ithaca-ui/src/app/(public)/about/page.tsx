import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Target, Users, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="border-border bg-muted/20 border-b">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
            We're mapping the world's <br className="hidden md:block" />{" "}
            scientific knowledge.
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl leading-relaxed">
            Ithaca is building the most intuitive interface for exploring
            scientific debates. We help researchers navigate the complex web of
            citations, contradictions, and consensus.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <div className="text-primary inline-flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
              <Target className="h-4 w-4" />
              Our Mission
            </div>
            <h2 className="text-3xl font-bold">
              Accelerating discovery by connecting the dots.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Scientific knowledge is fragmented across millions of static PDFs.
              Researchers spend countless hours tracing citations and
              reconstructing the history of ideas manually.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We believe that by visualizing the relationships between papers
              who contradicted whom, who supported whom we can make the
              scientific process transparent and accessible to everyone.
            </p>
          </div>
          <div className="bg-muted border-border relative aspect-square overflow-hidden rounded-2xl border md:aspect-auto md:h-[500px]">
            {/* Placeholder for About Us Image */}
            <div className="text-muted-foreground absolute inset-0 flex items-center justify-center">
              <div className="p-8 text-center">
                <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <Users className="text-primary h-8 w-8" />
                </div>
                <p className="text-sm font-medium">Team Photo / Office Shot</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-muted/30 border-border border-y">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">How we build</h2>
            <p className="text-muted-foreground text-lg">
              Our principles guide every decision we make, from database
              architecture to pixel-perfect UI.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-background border-border rounded-xl border p-8 shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Speed matters</h3>
              <p className="text-muted-foreground">
                Research is hard enough. Your tools shouldn't slow you down. We
                obsess over milliseconds.
              </p>
            </div>

            <div className="bg-background border-border rounded-xl border p-8 shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Truth over vanity</h3>
              <p className="text-muted-foreground">
                We prioritize accuracy and data integrity over flashy features.
                What you see is cited fact.
              </p>
            </div>

            <div className="bg-background border-border rounded-xl border p-8 shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Open by default</h3>
              <p className="text-muted-foreground">
                Science thrives in the open. We build focused on open access and
                transparent methodologies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h2 className="mb-6 text-3xl font-bold">Ready to explore?</h2>
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
