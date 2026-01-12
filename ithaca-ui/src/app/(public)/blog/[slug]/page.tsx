import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Share2, Twitter, Linkedin } from "lucide-react";

// This would typically use generateStaticParams for SSG
export default function BlogPostPage({ params }: { params: { slug: string } }) {
  // In a real app, fetch post data based on params.slug
  return (
    <article className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
      {/* Article Header */}
      <div className="border-b border-border bg-muted/10">
        <div className="container max-w-4xl mx-auto px-4 py-16">
          <Link 
            href="/blog" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
          
          <div className="space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider">
               Engineering
             </div>
             <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
               Rendering 10,000 Nodes at 60fps: A WebGL Journey
             </h1>
             <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
               <div className="flex items-center gap-2">
                 <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                   D
                 </div>
                 <span className="font-medium text-foreground">Dev Team</span>
               </div>
               <div className="flex items-center gap-2">
                 <Calendar className="h-4 w-4" />
                 Jan 05, 2026
               </div>
               <div>12 min read</div>
             </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-12">
        {/* Main Content */}
        <div className="prose prose-slate dark:prose-invert prose-lg max-w-none">
          <p className="lead">
            When we set out to build Ithaca, we knew visual scalability would be our biggest challenge.
            Force-directed graphs are computationally expensive, and the DOM simply wasn't built for thousands of moving elements.
          </p>
          
          <h2>The Limits of SVG</h2>
          <p>
            Our initial prototype used SVG elements for nodes and edges. It was simple, declarative, and easy to debug. 
            However, once we crossed the 500-node threshold, frame rates dropped below 30fps.
          </p>
          
          <h2>Enter Sigma.js & WebGL</h2>
          <p>
            We switched to <strong>Sigma.js</strong>, a dedicated graph drawing library that leverages WebGL for rendering.
            By offloading the heavy lifting to the GPU, we can render scenes with 10k+ nodes while maintaining a buttery smooth 60fps.
          </p>

          <div className="bg-muted p-6 rounded-lg my-8 not-prose border border-border">
             <h4 className="font-bold mb-2">Key Optimization: Instanced Rendering</h4>
             <p className="text-sm text-muted-foreground">
               Instead of issuing a draw call for every node, we use instanced rendering to draw all nodes in a single call,
               updating only their transformation matrices seeded from the layout engine.
             </p>
          </div>

          <h2>Force Atlas 2 on a Worker</h2>
          <p>
            Rendering is only half the battle. The layout algorithm (Force Atlas 2) needs to calculate repulsion and attraction forces 
            between every pair of nodes. This plays havoc with the main thread.
          </p>
          <p>
            We moved the physics simulation to a dedicated <code>WebWorker</code>. This ensures the UI remains responsive 
            (hover states, scrolling) even while the graph is "settling" into its final shape.
          </p>

          <h3>Conclusion</h3>
          <p>
            The combination of WebGL for rendering and Workers for physics allows Ithaca to visualize complex scientific fields
            without compromising on user experience. In upcoming posts, we'll discuss how we handle Level of Detail (LOD) and 
            semantic zooming.
          </p>
        </div>

        {/* Sidebar / Table of Contents / Share */}
        <aside className="space-y-8 hidden lg:block">
           <div className="sticky top-24 space-y-8">
             <div>
               <h4 className="font-bold text-sm uppercase tracking-wider mb-4 border-b pb-2">Table of Contents</h4>
               <nav className="space-y-2 text-sm">
                 <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">The Limits of SVG</a>
                 <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Enter Sigma.js & WebGL</a>
                 <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Force Atlas 2 on Worker</a>
                 <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Conclusion</a>
               </nav>
             </div>
             
             <div>
               <h4 className="font-bold text-sm uppercase tracking-wider mb-4 border-b pb-2">Share</h4>
               <div className="flex gap-2">
                 <Button variant="outline" size="icon" className="h-8 w-8">
                   <Twitter className="h-4 w-4" />
                 </Button>
                 <Button variant="outline" size="icon" className="h-8 w-8">
                   <Linkedin className="h-4 w-4" />
                 </Button>
                 <Button variant="outline" size="icon" className="h-8 w-8">
                   <Share2 className="h-4 w-4" />
                 </Button>
               </div>
             </div>
           </div>
        </aside>
      </div>
    </article>
  );
}
