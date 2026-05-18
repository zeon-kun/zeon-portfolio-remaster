"use client";

import type { Lang } from "@/lib/ratecard";

interface ProgressRailProps {
  total: number;
  current: number; // 0-based index during interview; -1 = paste; total = result
  lang: Lang;
}

export function ProgressRail({ total, current, lang }: ProgressRailProps) {
  const pasteLabel = lang === "jp" ? "貼付" : "PASTE";
  const resultLabel = lang === "jp" ? "結果" : "RESULT";

  return (
    <div className="flex flex-col items-center gap-1.5 py-2">
      {/* Paste bookend */}
      <div
        className={`text-[8px] font-mono uppercase tracking-[0.2em] transition-colors ${
          current === -1 ? "text-accent-primary" : "text-foreground/20"
        }`}
      >
        {pasteLabel}
      </div>

      {/* Interview step dots */}
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full transition-colors duration-200 mx-auto ${
              i < current
                ? "bg-accent-primary/60"
                : i === current
                  ? "bg-accent-primary"
                  : "bg-foreground/15"
            }`}
          />
        ))}
      </div>

      {/* Result bookend */}
      <div
        className={`text-[8px] font-mono uppercase tracking-[0.2em] transition-colors ${
          current === total ? "text-accent-primary" : "text-foreground/20"
        }`}
      >
        {resultLabel}
      </div>
    </div>
  );
}
