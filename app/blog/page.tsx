import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";

export const metadata: Metadata = {
  title: "ブログ — Blog | Zeon",
  description: "Thoughts on engineering, architecture, and craft.",
};

export const dynamic = "force-static";

export default function BlogListPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen pt-28 pb-24 md:pb-12 px-6 md:px-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black kanji-brutal text-foreground mb-2">ブログ</h1>
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted">
            Blog — {posts.length} {posts.length === 1 ? "article" : "articles"}
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted/60 font-mono">No articles yet.</p>
            <p className="text-xs text-muted/40 font-mono mt-2 tracking-wider">記事がまだありません</p>
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
