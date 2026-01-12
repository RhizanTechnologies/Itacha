import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, User } from "lucide-react";

// Mock data for blog posts (eventually from MDX or database)
const BLOG_POSTS = [
  {
    slug: "introducing-ithaca",
    title: "Introducing Ithaca: A New Way to Map Science",
    excerpt: "Today we're launching public beta. Learn how we're reimagining citation graphs using force-directed layouts and NLP.",
    author: "Alice Chen",
    date: "Jan 12, 2026",
    category: "Product",
    readTime: "5 min read",
  },
  {
    slug: "graph-theory-for-researchers",
    title: "Graph Theory 101 for Researchers",
    excerpt: "Understanding the difference between centrality, clusters, and bridges in the context of scientific literature.",
    author: "Dr. Robert Vance",
    date: "Jan 10, 2026",
    category: "Technical",
    readTime: "8 min read",
  },
  {
    slug: "building-performant-webgl-graphs",
    title: "Rendering 10,000 Nodes at 60fps",
    excerpt: "A deep dive into our Sigma.js implementation and how we optimized WebGL shaders for the browser.",
    author: "Dev Team",
    date: "Jan 05, 2026",
    category: "Engineering",
    readTime: "12 min read",
  },
];

export default function BlogIndexPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <section className="border-b border-border bg-muted/20">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            Knowledge Base
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            The Ithaca Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Updates on our product, engineering deep dives, and thoughts on the future of meta-science.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post) => (
            <Link 
              key={post.slug} 
              href={`/blog/${post.slug}`}
              className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-video bg-muted relative overflow-hidden">
                 {/* Placeholder for blog image */}
                 <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-secondary/30">
                    <span className="font-semibold text-sm">Cover Image</span>
                 </div>
              </div>
              
              <div className="flex flex-col flex-1 p-6">
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="text-primary font-medium">{post.category}</span>
                  <span>•</span>
                  <span>{post.date}</span>
                </div>
                
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <User className="h-3 w-3" />
                    {post.author}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {post.readTime}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      
      {/* Newsletter / CTA */}
      <section className="border-t border-border bg-muted/20">
        <div className="container mx-auto px-4 py-20 text-center max-w-2xl">
           <h2 className="text-2xl font-bold mb-4">Stay in the loop</h2>
           <p className="text-muted-foreground mb-8">
             Get the latest updates on Ithaca feature releases and research tools.
           </p>
           <form className="flex gap-2 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
             <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
             />
             <Button type="submit">Subscribe</Button>
           </form>
        </div>
      </section>
    </div>
  );
}
