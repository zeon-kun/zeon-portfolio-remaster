"use client";

import { Mail } from "lucide-react";
import { ScoreGauge } from "./ScoreGauge";
import { DimensionBar } from "./DimensionBar";
import { DIMENSIONS } from "@/lib/ratecard";
import { formatIDR, formatUSD } from "@/lib/ratecard";
import { PERSONAL_INFO } from "@/lib/content";
import type { ScoreResult, RateEstimate, Lang } from "@/lib/ratecard";

interface ResultCardProps {
  score: ScoreResult;
  estimate: RateEstimate;
  onRestart: () => void;
  lang: Lang;
}

export function ResultCard({ score, estimate, onRestart, lang }: ResultCardProps) {
  const isJp = lang === "jp";

  // Sorted contributions for "what drives the price" top-3
  const sorted = [...score.contributions].sort((a, b) => b.weighted - a.weighted);
  const top3 = sorted.slice(0, 3);
  const maxWeighted = sorted[0]?.weighted ?? 1;

  // Dimension name labels (from DIMENSIONS definition)
  const dimLabelMap: Record<string, { jp: string; en: string }> = {
    scope: { jp: "規模", en: "Scope" },
    stackMatch: { jp: "スタック", en: "Stack Match" },
    frontend: { jp: "フロント", en: "Frontend" },
    backend: { jp: "バックエンド", en: "Backend" },
    integrations: { jp: "連携", en: "Integrations" },
    infra: { jp: "インフラ", en: "Infra" },
    engagement: { jp: "関与", en: "Engagement" },
  };

  const mailtoSubject = isJp
    ? `プロジェクト相談 — 複雑度スコア ${score.score100}`
    : `Project inquiry — complexity score ${score.score100}`;

  const mailtoHref = `mailto:${PERSONAL_INFO.email}?subject=${encodeURIComponent(mailtoSubject)}`;

  return (
    <div className="flex flex-col gap-10">
      {/* Score — no card, full air. The payoff moment. */}
      <div className="relative flex flex-col items-center pt-2 pb-6">
        <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted/50 mb-4">
          {isJp ? "複雑度スコア" : "Complexity Score"}
        </p>
        <ScoreGauge score={score.score100} tierLabel={score.tierLabel} lang={lang} />
      </div>

      {/* Rate estimate — the hero. Editorial ruled band, IDR is the giant number. */}
      <div className="relative border-y border-foreground/15 py-10 overflow-hidden">
        <span
          aria-hidden="true"
          className="absolute -right-2 top-1/2 -translate-y-1/2 writing-vertical text-7xl font-black kanji-brutal text-foreground/[0.04] select-none pointer-events-none"
        >
          料金
        </span>
        <div className="relative flex flex-col gap-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted">
            {isJp ? "プロジェクト費用 (IDR)" : "Project Fee (IDR)"}
          </p>
          <p
            className="text-4xl md:text-5xl font-black tabular-nums text-foreground leading-none mt-1"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {formatIDR(estimate.idrFee.low)} – {formatIDR(estimate.idrFee.high)}
          </p>
          <p className="text-sm font-mono text-muted mt-2">
            ≈ {formatUSD(estimate.usd.low)} – {formatUSD(estimate.usd.high)}{" "}
            <span className="text-muted/50">
              {isJp ? "/ SEAリモート基準 $30–45/hr" : "/ SEA remote basis $30–45/hr"}
            </span>
          </p>
        </div>

        <div className="relative mt-6 pt-5 border-t border-foreground/10 grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
          <div className="flex flex-col gap-0.5">
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted/60">
              {isJp ? "時間単価 (IDR)" : "Hourly (IDR)"}
            </p>
            <p className="text-sm font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-mono)" }}>
              {formatIDR(estimate.idr.low)} – {formatIDR(estimate.idr.high)}
            </p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted/60">
              {isJp ? "推定工数" : "Estimated Hours"}
            </p>
            <p className="text-sm font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-mono)" }}>
              {estimate.hours.low} – {estimate.hours.high} hrs
            </p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted/60">
              {isJp ? "推定期間" : "Estimated Timeline"}
            </p>
            <p className="text-sm font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-mono)" }}>
              {estimate.weeks.low} – {estimate.weeks.high} {isJp ? "週" : "weeks"}
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown + Drivers — demoted reference, compressed side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-foreground/10 bg-background/40 backdrop-blur-sm p-6 flex flex-col gap-4">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted">
            {isJp ? "次元の内訳" : "Dimension Breakdown"}
          </p>
          <div className="flex flex-col gap-3">
            {DIMENSIONS.map((dim, i) => {
              const contrib = score.contributions.find((c) => c.id === dim.id)!;
              const dimLabel = dimLabelMap[dim.id] ?? { jp: dim.id, en: dim.id };
              return (
                <DimensionBar
                  key={dim.id}
                  dimensionLabel={dimLabel}
                  valueLabel={contrib.label}
                  weighted={contrib.weighted}
                  maxWeighted={maxWeighted}
                  index={i}
                  lang={lang}
                />
              );
            })}
          </div>
        </div>

        <div className="border border-foreground/10 bg-background/40 backdrop-blur-sm p-6 flex flex-col gap-3">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted">
            {isJp ? "価格を左右する主要因" : "Main Price Drivers"}
          </p>
          <ol className="flex flex-col gap-3">
            {top3.map((c, i) => {
              const dimLabel = dimLabelMap[c.id] ?? { jp: c.id, en: c.id };
              const name = isJp ? dimLabel.jp : dimLabel.en;
              const val = isJp ? c.label.jp : c.label.en;
              return (
                <li key={c.id} className="flex items-start gap-3 text-sm border-l-2 border-l-accent-primary/40 pl-3">
                  <span className="text-base font-black font-mono text-accent-primary tabular-nums flex-shrink-0 leading-tight">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-foreground/70 leading-snug">
                    <span className="font-semibold text-foreground">{name}</span>
                    <br />
                    <span className="text-[12px] font-mono text-muted">{val}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Disclaimer + CTA — fine print footer */}
      <div className="flex flex-col gap-5 pt-2">
        <p className="text-[9px] font-mono text-muted/50 tracking-[0.08em] leading-relaxed">
          {isJp
            ? "非拘束の概算 — 最終スコープと費用は打ち合わせ後に確定します。本ツールはあくまで参考値です。"
            : "Non-binding estimate — final scope & fee are set after discussion. This tool is a reference only."}
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <a
            href={mailtoHref}
            className="inline-flex items-center gap-2 bg-accent-primary text-background text-[10px] font-mono font-bold uppercase tracking-[0.15em] px-6 py-3 transition-opacity hover:opacity-80"
          >
            <Mail size={13} />
            {isJp ? "問い合わせる" : "Get in touch"}
          </a>
          <button
            type="button"
            onClick={onRestart}
            className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted hover:text-foreground transition-colors px-2 py-1"
          >
            ↺ {isJp ? "再見積もり" : "Re-estimate"}
          </button>
        </div>
      </div>
    </div>
  );
}
