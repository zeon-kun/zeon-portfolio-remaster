import type { Metadata } from "next";
import { IkenbakoBoard } from "@/components/ikenbako/IkenbakoBoard";

export const metadata: Metadata = {
  title: "意見箱 — Suggestion Box | Zeon",
  description: "Drop a feature request or pain point. Sign in with email to vote.",
};

export const dynamic = "force-static";

export default function IkenbakoPage() {
  return (
    <main className="min-h-screen pt-28 pb-24 md:pb-12 px-6 md:px-12 relative overflow-hidden">
      <div className="max-w-3xl mx-auto relative">
        {/* Page header — mirrors /payme styling */}
        <header className="mb-14 relative">
          <span
            aria-hidden="true"
            className="absolute -left-5 md:-left-8 top-0 writing-vertical text-[10px] font-mono text-foreground/10 tracking-widest select-none"
          >
            意見
          </span>

          <span
            aria-hidden="true"
            className="absolute right-0 top-0 text-[9px] font-mono text-muted/40 tracking-[0.2em] uppercase"
          >
            意見箱 / Suggestion Box
          </span>

          <h1 className="text-3xl md:text-4xl font-black kanji-brutal text-foreground mb-2">意見箱</h1>
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted">
            Drop a request or pain point — vote on what matters
          </p>
        </header>

        <IkenbakoBoard />
      </div>
    </main>
  );
}
