import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight, Code, Key, Book, Shield } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <div className="bg-background text-foreground min-h-screen flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border h-[calc(100vh-65px)] sticky top-[65px] hidden lg:block overflow-y-auto bg-muted/10">
        <nav className="p-6 space-y-8">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Getting Started</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="#introduction" className="text-primary hover:underline">Introduction</a></li>
              <li><a href="#authentication" className="text-muted-foreground hover:text-foreground">Authentication</a></li>
              <li><a href="#rate-limits" className="text-muted-foreground hover:text-foreground">Rate Limits</a></li>
            </ul>
          </div>
          <div>
             <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Endpoints</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="#graph-api" className="text-muted-foreground hover:text-foreground">Graph API</a></li>
              <li><a href="#search-api" className="text-muted-foreground hover:text-foreground">Search API</a></li>
              <li><a href="#user-api" className="text-muted-foreground hover:text-foreground">User API</a></li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <section className="border-b border-border bg-muted/20">
            <div className="container mx-auto px-8 py-12">
               <h1 className="text-4xl font-bold mb-4">Developer API</h1>
               <p className="text-xl text-muted-foreground">
                 Integrate Ithaca's citation graph data into your own applications.
               </p>
            </div>
        </section>

        <div className="container mx-auto px-8 py-12 max-w-4xl">
           <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 id="introduction">Introduction</h2>
              <p>
                The Ithaca API provides programmatic access to our citation graph database. 
                You can use it to build custom visualizations, feed metrics into academic workflows, 
                or analyze network support/contradiction patterns.
              </p>

              <div className="flex gap-4 not-prose my-8">
                <Button className="gap-2">
                  <Key className="h-4 w-4" />
                  Get API Key
                </Button>
                <Button variant="outline" className="gap-2">
                  <Book className="h-4 w-4" />
                  View OpenAPI Spec
                </Button>
              </div>

              <h2 id="authentication">Authentication</h2>
              <p>
                All API requests require a Bearer Token in the header.
              </p>
              <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
{`Authorization: Bearer <YOUR_API_KEY>`}
              </pre>

              <h2 id="rate-limits">Rate Limits</h2>
              <p>
                Free tier Usage is capped at 1,000 requests per hour. Pro plans offer higher limits.
                Check the headers for your current usage status.
              </p>

              <h2 id="graph-api">Graph API</h2>
              <p>
                Retrieve nodes and edges for a specific paper or topic.
              </p>
              
              <h3 className="text-lg font-semibold mt-6 mb-2"><code>GET /v1/graph/paper/:id</code></h3>
              <p>Returns the ego-network for a specific paper ID (DOI or internal ID).</p>
               <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "nodes": [
    { "id": "10.1038/nature123", "title": "...", "year": 2023, "citations": 45 },
    ...
  ],
  "edges": [
    { "source": "10.1038/nature123", "target": "10.1126/science456", "type": "SUPPORTS" }
  ]
}`}
              </pre>

           </div>
        </div>
      </div>
    </div>
  );
}
