"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import type { Bilingual, Lang } from "@/lib/ratecard";

interface DimensionBarProps {
  dimensionLabel: Bilingual; // dimension name (e.g. "scope")
  valueLabel: Bilingual;     // selected tier label
  weighted: number;          // normalised contribution, 0–maxWeighted
  maxWeighted: number;       // largest weighted value in the set (for scale)
  lang: Lang;
}

export function DimensionBar({ dimensionLabel, valueLabel, weighted, maxWeighted, lang }: DimensionBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const pct = maxWeighted > 0 ? weighted / maxWeighted : 0;

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    if (prefersReducedMotion()) {
      gsap.set(bar, { scaleX: pct });
      return;
    }

    gsap.fromTo(
      bar,
      { scaleX: 0 },
      { scaleX: pct, duration: 0.6, ease: "power2.out", delay: 0.05 }
    );
  }, [pct]);

  const dimName = lang === "jp" ? dimensionLabel.jp : dimensionLabel.en;
  const valName = lang === "jp" ? valueLabel.jp : valueLabel.en;

  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-[10px] font-mono text-muted w-20 flex-shrink-0 truncate">{dimName}</span>
      <div className="flex-1 h-1 bg-foreground/8 relative overflow-hidden">
        <div
          ref={barRef}
          className="absolute inset-0 bg-accent-primary origin-left"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted/60 w-28 flex-shrink-0 truncate text-right">{valName}</span>
    </div>
  );
}
