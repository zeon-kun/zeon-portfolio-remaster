import type { Metadata } from "next";
import { PERSONAL_INFO, WORK_EXPERIENCE } from "@/lib/content";

export const metadata: Metadata = {
  title: "経歴 — Experience | Jeong",
  description: "Work history — roles, companies and what shipped at each.",
};

export const dynamic = "force-static";

export default function ExperiencePage() {
  const education = PERSONAL_INFO.education;

  return (
    <div className="pt-6 pb-12 px-6 md:px-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black kanji-brutal text-foreground mb-2">経歴</h1>
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted">
            Experience — {WORK_EXPERIENCE.length} roles
          </p>
        </header>

        <ol className="space-y-10">
          {WORK_EXPERIENCE.map((entry) => (
            <li key={entry.company} className="border-b border-foreground/8 pb-8">
              <div className="flex items-baseline justify-between gap-4 mb-1">
                <h2 className="text-lg heading-serif text-foreground">
                  {entry.company}
                  {entry.current && (
                    <span className="ml-3 align-middle text-[9px] font-mono uppercase tracking-[0.2em] text-accent-primary border border-accent-primary/30 px-1.5 py-0.5">
                      Now
                    </span>
                  )}
                </h2>
                <span className="shrink-0 text-[10px] font-mono text-muted/60 tracking-wider">{entry.period}</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted mb-3">
                {entry.role} · {entry.location}
              </p>
              <p className="text-sm text-muted leading-relaxed mb-3">{entry.description}</p>
              <ul className="space-y-1.5">
                {entry.highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-sm text-foreground/80 leading-relaxed">
                    <span aria-hidden="true" className="text-accent-primary/60 shrink-0">
                      —
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <section className="mt-10">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted mb-4">Education</h2>
          <p className="text-sm text-foreground">
            {education.degree}, {education.institution}
          </p>
          <p className="text-[10px] font-mono text-muted/60 tracking-wider mt-1">
            {education.period} · GPA {education.gpa}
          </p>
        </section>
      </div>
    </div>
  );
}
