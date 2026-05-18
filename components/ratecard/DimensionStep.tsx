"use client";

import type { Dimension, TierPoints, Lang } from "@/lib/ratecard";

interface DimensionStepProps {
  dimension: Dimension;
  value: TierPoints;
  onChange: (v: TierPoints) => void;
  onNext: () => void;
  onBack: () => void;
  index: number;
  total: number;
  lang: Lang;
}

export function DimensionStep({
  dimension,
  value,
  onChange,
  onNext,
  onBack,
  index,
  total,
  lang,
}: DimensionStepProps) {
  const isJp = lang === "jp";
  const question = isJp ? dimension.question.jp : dimension.question.en;

  return (
    <div className="flex flex-col gap-6">
      {/* Question header */}
      <div>
        <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted/50 mb-2">
          {isJp ? `質問 ${index + 1} / ${total}` : `Question ${index + 1} / ${total}`}
        </p>
        <p className="text-base font-semibold text-foreground leading-snug">{question}</p>
      </div>

      {/* Tier options */}
      <div className="flex flex-col gap-2">
        {dimension.tiers.map((tier) => {
          const isSelected = value === tier.points;
          const label = isJp ? tier.label.jp : tier.label.en;

          return (
            <button
              key={tier.points}
              type="button"
              onClick={() => onChange(tier.points)}
              className={`w-full text-left px-4 py-3 border transition-colors text-sm ${
                isSelected
                  ? "border-accent-primary/50 bg-accent-primary/5 text-foreground"
                  : "border-foreground/10 bg-background/40 text-foreground/70 hover:border-foreground/25 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-[9px] font-mono tabular-nums flex-shrink-0 ${
                    isSelected ? "text-accent-primary" : "text-foreground/25"
                  }`}
                >
                  {String(tier.points).padStart(2, "0")}
                </span>
                <span className="font-mono text-[11px] leading-snug">{label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted hover:text-foreground transition-colors px-2 py-1"
        >
          ← {isJp ? "戻る" : "Back"}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="bg-accent-primary text-background text-[10px] font-mono font-bold uppercase tracking-[0.15em] px-5 py-2 transition-opacity"
        >
          {index === total - 1
            ? isJp
              ? "スコアを計算 →"
              : "Calculate Score →"
            : isJp
              ? "次へ →"
              : "Next →"}
        </button>
      </div>
    </div>
  );
}
