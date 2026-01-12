import { Badge } from "@/components/ui/badge";

export default function ChangelogPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Changelog</h1>
        <p className="text-xl text-muted-foreground">
          New updates and improvements to Ithaca.
        </p>
      </div>

      <div className="space-y-12 relative border-l border-border ml-4 md:ml-0 md:pl-0">
        {/* Update 1 */}
        <div className="relative md:grid md:grid-cols-[200px_1fr] md:gap-8">
          <div className="mb-4 md:mb-0 md:text-right">
            <span className="text-sm text-muted-foreground font-medium sticky top-24">
              January 12, 2026
            </span>
            <div className="absolute -left-[21px] md:left-auto md:-right-[21px] top-1.5 h-3 w-3 rounded-full bg-primary border-4 border-background" />
          </div>
          <div className="pl-6 md:pl-0">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-bold">Public Beta Launch</h2>
              <Badge variant="default">v1.0.0-beta</Badge>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                We're excited to open Ithaca to the public! This release includes:
              </p>
              <ul>
                <li><strong>Citation Graph Explorer:</strong> Visualize networks of up to 10k papers.</li>
                <li><strong>Semantic Search:</strong> Find papers by concept, not just keyword.</li>
                <li><strong>Researcher Profiles:</strong> Sync your work via ORCID.</li>
                <li><strong>Dark Mode:</strong> Fully supported across the app.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Update 2 */}
        <div className="relative md:grid md:grid-cols-[200px_1fr] md:gap-8">
          <div className="mb-4 md:mb-0 md:text-right">
            <span className="text-sm text-muted-foreground font-medium sticky top-24">
              December 20, 2025
            </span>
            <div className="absolute -left-[21px] md:left-auto md:-right-[21px] top-1.5 h-3 w-3 rounded-full bg-muted border-4 border-background" />
          </div>
          <div className="pl-6 md:pl-0">
             <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xl font-bold text-muted-foreground">Alpha Release</h2>
              <Badge variant="secondary">v0.9.0</Badge>
            </div>
            <p className="text-muted-foreground">
              Private alpha testing with selected research labs. Focusing on graph rendering performance and data accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
