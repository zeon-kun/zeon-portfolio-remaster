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

      {/* Interview step markers — connected rail */}
      <div className="relative flex flex-col items-center gap-2.5 py-1">
        <div
          aria-hidden="true"
          className="absolute top-1 bottom-1 w-px bg-foreground/10"
        />
        {Array.from({ length: total }).map((_, i) => {
          const isCurrent = i === current;
          const isDone = i < current;
          return (
            <div key={i} className="relative flex items-center">
              <div
                className={`w-2 h-2 transition-colors duration-200 ${
                  isDone
                    ? "bg-accent-primary"
                    : isCurrent
                      ? "bg-background border border-accent-primary"
                      : "bg-foreground/15"
                }`}
              />
              {isCurrent && (
                <span className="absolute left-4 text-[10px] font-mono tabular-nums text-accent-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
            </div>
          );
        })}
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
