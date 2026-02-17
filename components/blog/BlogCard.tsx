"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { TransitionLink } from "@/components/layout/TransitionLink";
import type { PostMeta } from "@/lib/blog";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function BlogCard({ post }: { post: PostMeta }) {
  const router = useRouter();

  const handleCardClick = useCallback(() => {
    router.push(`/blog/${post.slug}`);
  }, [router, post.slug]);

  return (
    <div
      role="article"
      onClick={handleCardClick}
      className="group cursor-pointer py-5 border-b border-foreground/6 hover:bg-foreground/[0.02] transition-colors duration-150 -mx-3 px-3"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground group-hover:text-accent-primary transition-colors duration-150 mb-1">
            <TransitionLink href={`/blog/${post.slug}`} className="hover:text-accent-primary">
              {post.title}
            </TransitionLink>
          </h2>
          {post.description && <p className="text-sm text-muted/80 leading-relaxed line-clamp-2">{post.description}</p>}
          {post.tags.length > 0 && (
            <div className="flex gap-2 mt-2">
              {post.tags.map((tag) => (
                <TransitionLink
                  key={tag}
                  href={`/blog/tag/${tag}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] font-mono uppercase tracking-wider text-muted/60 border border-foreground/8 px-1.5 py-0.5 hover:text-accent-primary hover:border-accent-primary/30 transition-colors duration-150"
                >
                  {tag}
                </TransitionLink>
              ))}
            </div>
          )}
        </div>
        <span className="shrink-0 text-[10px] font-mono text-muted/50 tracking-wider pt-1">
          {post.date ? formatDate(post.date) : ""}
        </span>
      </div>
    </div>
  );
}
