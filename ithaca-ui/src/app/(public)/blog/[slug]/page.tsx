import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { notFound } from "next/navigation";
import { getBlogPost, BLOG_POSTS } from "@/content/blog-posts";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const paragraphs = post.content.split("\n\n").filter((p) => p.trim());

  return (
    <article className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
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
              {post.category}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium text-foreground">
                  {post.author}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {post.date}
              </div>
              <div>{post.readTime}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-slate dark:prose-invert prose-lg max-w-none">
          {paragraphs.map((block, i) => {
            const trimmed = block.trim();
            if (trimmed.startsWith("## ")) {
              return (
                <h2 key={i}>{trimmed.slice(3)}</h2>
              );
            }
            if (trimmed.startsWith("### ")) {
              return (
                <h3 key={i}>{trimmed.slice(4)}</h3>
              );
            }
            if (trimmed.startsWith("- ") || trimmed.startsWith("1. ")) {
              const items = trimmed.split("\n");
              const isOrdered = trimmed.startsWith("1. ");
              const Tag = isOrdered ? "ol" : "ul";
              return (
                <Tag key={i}>
                  {items.map((item, j) => (
                    <li key={j}>
                      {item.replace(/^[-\d]+[.)]\s*/, "")}
                    </li>
                  ))}
                </Tag>
              );
            }
            return <p key={i}>{trimmed}</p>;
          })}
        </div>
      </div>
    </article>
  );
}
