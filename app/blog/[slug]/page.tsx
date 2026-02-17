import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import { getAllSlugs, getPostBySlug, extractToc } from "@/lib/blog";
import { mdxComponents } from "@/components/blog/MDXComponents";
import { BlogToC } from "@/components/blog/BlogToC";
import { TransitionLink } from "@/components/layout/TransitionLink";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: `${post.meta.title} | Zeon Blog`,
    description: post.meta.description,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const toc = extractToc(post.content);

  const { content } = await compileMDX({
    source: post.content,
    components: mdxComponents,
    options: {
      mdxOptions: {
        rehypePlugins: [rehypeSlug],
      },
    },
  });

  const formattedDate = post.meta.date
    ? new Date(post.meta.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <main className="min-h-screen pt-28 pb-24 md:pb-12 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <TransitionLink
          href="/blog"
          className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={12} />
          Back to blog
        </TransitionLink>

        {/* Article header */}
        <header className="mb-10">
          <h1 className="text-2xl md:text-3xl font-black kanji-brutal text-foreground mb-3">
            {post.meta.title}
          </h1>
          <div className="flex items-center gap-3 text-[10px] font-mono text-muted/60 tracking-wider uppercase">
            {formattedDate && <time>{formattedDate}</time>}
            {post.meta.tags.length > 0 && (
              <>
                <span className="text-foreground/15">|</span>
                <div className="flex gap-2">
                  {post.meta.tags.map((tag) => (
                    <TransitionLink
                      key={tag}
                      href={`/blog/tag/${tag}`}
                      className="hover:text-accent-primary transition-colors duration-150"
                    >
                      {tag}
                    </TransitionLink>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content + ToC grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-12">
          <article>{content}</article>
          <aside className="hidden lg:block">
            <BlogToC entries={toc} />
          </aside>
        </div>
      </div>
    </main>
  );
}
