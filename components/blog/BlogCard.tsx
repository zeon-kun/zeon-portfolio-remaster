"use client";

import { useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { TransitionLink } from "@/components/layout/TransitionLink";
import { transitionState } from "@/lib/transition";
import { prefersReducedMotion } from "@/lib/motion";
import type { PostMeta } from "@/lib/blog";

const EXIT_DURATION = 600;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function BlogCard({ post }: { post: PostMeta }) {
  const router = useRouter();
  const pathname = usePathname();
  const navigatingRef = useRef(false);

  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // If a child link (title or tag) already handled navigation, bail
      const target = e.target as HTMLElement;
      if (target.closest("a")) return;

      const href = `/blog/${post.slug}`;
      if (href === pathname) return;
      if (transitionState.phase !== "idle") return;
      if (navigatingRef.current) return;

      navigatingRef.current = true;

      if (prefersReducedMotion()) {
        router.push(href);
        return;
      }

      transitionState.targetHref = href;
      transitionState.setPhase("exiting");

      setTimeout(() => {
        router.push(href);
      }, EXIT_DURATION);
    },
    [router, pathname, post.slug]
  );

  return (
    <div
      role="article"
      onClick={handleCardClick}
      className="group cursor-pointer py-5 border-b border-foreground/6 hover:bg-foreground/[0.02] transition-colors duration-150 -mx-3 px-3"
    >
      {/* Banner thumbnail — full-width, containerized */}
      {post.banner && (
        <div className="mb-3 border-2 border-foreground/8 overflow-hidden">
          <img
            src={post.banner}
            alt=""
            className="w-full h-auto object-cover max-h-[140px] group-hover:scale-[1.01] transition-transform duration-300 ease-out"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg heading-serif text-foreground group-hover:text-accent-primary transition-colors duration-150 mb-1">
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
