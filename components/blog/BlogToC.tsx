"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TocEntry } from "@/lib/blog";

export function BlogToC({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string>("");
  const rafId = useRef(0);

  const updateActive = useCallback(() => {
    if (entries.length === 0) return;

    const headings = entries
      .map((e) => ({ id: e.id, el: document.getElementById(e.id) }))
      .filter((h): h is { id: string; el: HTMLElement } => h.el !== null);

    if (headings.length === 0) return;

    // If scrolled to bottom, activate last heading
    const scrollBottom = window.scrollY + window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    if (docHeight - scrollBottom < 40) {
      setActiveId(headings[headings.length - 1].id);
      return;
    }

    // Find the last heading that has scrolled past the top threshold
    const threshold = 100;
    let current = headings[0].id;

    for (const { id, el } of headings) {
      const top = el.getBoundingClientRect().top;
      if (top <= threshold) {
        current = id;
      } else {
        break;
      }
    }

    setActiveId(current);
  }, [entries]);

  useEffect(() => {
    if (entries.length === 0) return;

    function onScroll() {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(updateActive);
    }

    // Set initial active heading
    updateActive();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [entries, updateActive]);

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
