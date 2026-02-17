import type { Metadata } from "next";
import { getAllTags, getPostsByTag } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";
import { TransitionLink } from "@/components/layout/TransitionLink";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag} — Blog | Zeon`,
    description: `Articles tagged with "${tag}".`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const posts = getPostsByTag(tag);

  return (
    <main className="min-h-screen pt-28 pb-24 md:pb-12 px-6 md:px-12">
      <div className="max-w-2xl mx-auto">
        <TransitionLink
          href="/blog"
          className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={12} />
          All articles
        </TransitionLink>

        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black kanji-brutal text-foreground mb-2">
            #{tag}
          </h1>
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted">
            {posts.length} {posts.length === 1 ? "article" : "articles"}
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted/60 font-mono">No articles with this tag.</p>
          </div>
        ) : (
          <div>
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
