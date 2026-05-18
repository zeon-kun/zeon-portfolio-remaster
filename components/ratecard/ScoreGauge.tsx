"use client";

import type { Bilingual, Lang } from "@/lib/ratecard";

interface ScoreGaugeProps {
  score: number;
  tierLabel: Bilingual;
  lang: Lang;
}

export function ScoreGauge({ score, tierLabel, lang }: ScoreGaugeProps) {
  const label = lang === "jp" ? tierLabel.jp : tierLabel.en;

  // Map score 0-100 to hue: green(120) at 0 → orange(30) at 50 → red(0) at 100
  const hue = Math.round(120 - score * 1.2);
  const color = `hsl(${hue}, 55%, 42%)`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="text-6xl md:text-7xl font-black tabular-nums leading-none"
        style={{ color, fontFamily: "var(--font-mono)" }}
      >
        {score}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">
        / 100 — {label}
      </div>
    </div>
  );
}
