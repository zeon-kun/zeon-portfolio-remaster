"use client";

import { useState, useEffect } from "react";
import type { TocEntry } from "@/lib/blog";

export function BlogToC({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (entries.length === 0) return;

    const headings = entries
      .map((e) => document.getElementById(e.id))
      .filter(Boolean) as HTMLElement[];

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (observed) => {
        for (const entry of observed) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="sticky top-28 space-y-1"
    >
      <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted mb-3">
        Contents
      </p>
      {entries.map((entry) => (
        <a
          key={entry.id}
          href={`#${entry.id}`}
          className={`
            block text-[12px] leading-relaxed transition-colors duration-150
            ${entry.level === 3 ? "pl-3" : ""}
            ${
              activeId === entry.id
                ? "text-accent-primary font-bold"
                : "text-muted/60 hover:text-foreground"
            }
          `}
        >
          {entry.text}
        </a>
      ))}
    </nav>
  );
}
