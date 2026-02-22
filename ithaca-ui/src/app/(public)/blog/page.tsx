import Link from "next/link";
import { User } from "lucide-react";
import { BLOG_POSTS } from "@/content/blog-posts";

export default function BlogIndexPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <section className="border-b border-border bg-muted/20">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Engineering deep dives and thoughts on the future of meta-science.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        {BLOG_POSTS.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5" />

                <div className="flex flex-col flex-1 p-6">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="text-primary font-medium">
                      {post.category}
                    </span>
                    <span>&bull;</span>
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
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No posts yet. Check back soon!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
