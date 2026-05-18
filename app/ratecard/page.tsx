import type { Metadata } from "next";
import { RatecardWizard } from "@/components/ratecard/RatecardWizard";

export const metadata: Metadata = {
  title: "料金 — Ratecard | Zeon",
  description:
    "Estimate your project complexity and get a transparent rate range. Paste your brief, walk a short interview, and get a deterministic IDR + USD fee estimate.",
};

export const dynamic = "force-static";

export default function RatecardPage() {
  return (
    <main className="min-h-screen pt-28 pb-24 md:pb-12 px-6 md:px-12 relative overflow-hidden">
      <div className="max-w-3xl mx-auto relative">
        <header className="mb-14 relative">
          <span
            aria-hidden="true"
            className="absolute -left-5 md:-left-8 top-0 writing-vertical text-[10px] font-mono text-foreground/10 tracking-widest select-none"
          >
            料金
          </span>

          <span
            aria-hidden="true"
            className="absolute right-0 top-0 text-[9px] font-mono text-muted/40 tracking-[0.2em] uppercase"
          >
            料金 / Ratecard
          </span>

          <h1 className="text-3xl md:text-4xl font-black kanji-brutal text-foreground mb-2">料金</h1>
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted">
            Paste your project brief — get a transparent complexity score &amp; fee estimate
          </p>
        </header>

        <RatecardWizard />
      </div>
    </main>
  );
}
