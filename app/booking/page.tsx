import type { Metadata } from "next";
import { Suspense } from "react";
import { CalEmbed } from "@/components/booking/CalEmbed";
import { PERSONAL_INFO } from "@/lib/content";

export const metadata: Metadata = {
  title: "予約 — Booking | Zeon",
  description:
    "Book a call — scoping, technical review, or just a conversation. Pick a slot that works and it lands straight in the calendar.",
};

export const dynamic = "force-static";

const AGENDA = [
  { no: "01", jp: "スコープ", en: "Project scoping", note: "You have a brief. We size it together." },
  { no: "02", jp: "技術相談", en: "Technical review", note: "Architecture, stack choice, second opinion." },
  { no: "03", jp: "雑談", en: "Just a conversation", note: "No agenda required." },
];

export default function BookingPage() {
  return (
    <main className="min-h-screen pt-28 pb-24 md:pb-12 px-6 md:px-12 relative overflow-hidden">
      <div className="max-w-3xl mx-auto relative">
        {/* Page header */}
        <header className="mb-14 relative">
          {/* Vertical kanji — left edge */}
          <span
            aria-hidden="true"
            className="absolute -left-5 md:-left-8 top-0 writing-vertical text-[10px] font-mono text-foreground/10 tracking-widest select-none"
          >
            予約
          </span>

          {/* Top-right annotation */}
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 text-[9px] font-mono text-muted/40 tracking-[0.2em] uppercase"
          >
            予約 / Booking
          </span>

          <h1 className="text-3xl md:text-4xl font-black kanji-brutal text-foreground mb-2">予約</h1>
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted">
            Book a call — pick a slot, no back-and-forth
          </p>
        </header>

        {/* What a call is for */}
        <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-px bg-foreground/8 border border-foreground/8">
          {AGENDA.map((item) => (
            <div key={item.no} className="bg-background/60 backdrop-blur-sm p-4 space-y-1.5">
              <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted/40">{item.no}</p>
              <p className="text-sm font-bold text-foreground">
                <span className="font-jp">{item.jp}</span>
                <span className="text-muted/30 mx-1.5">/</span>
                <span className="text-xs font-mono uppercase tracking-wider">{item.en}</span>
              </p>
              <p className="text-[10px] leading-relaxed text-foreground/50">{item.note}</p>
            </div>
          ))}
        </div>

        {/* Cal.com embed */}
        <Suspense
          fallback={
            <div className="border border-foreground/8 bg-background/40 h-[620px] flex items-center justify-center">
              <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted/40">
                読み込み中 · Loading
              </span>
            </div>
          }
        >
          <CalEmbed />
        </Suspense>

        {/* Bottom annotation */}
        <p className="mt-8 text-[10px] font-mono text-muted/35 uppercase tracking-[0.2em] text-center">
          Async works too —{" "}
          <a
            href={`mailto:${PERSONAL_INFO.email}`}
            className="text-muted/50 hover:text-foreground transition-colors underline underline-offset-4 decoration-foreground/15"
          >
            {PERSONAL_INFO.email}
          </a>
        </p>
      </div>
    </main>
  );
}
