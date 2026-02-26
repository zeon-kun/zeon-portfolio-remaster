"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { WORK_EXPERIENCE, ORGANIZATIONS } from "@/lib/content";


export function ExperienceSlide({ isActive }: { isActive: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (!isActive || hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;

    if (reduced) return;

    const entries = containerRef.current.querySelectorAll("[data-exp-entry]");
    gsap.from(entries, {
      x: -50,
      opacity: 0,
      duration: 0.7,
      stagger: 0.15,
      ease: "power3.out",
      delay: 0.3,
    });
  }, [isActive, reduced]);

  return (
    <>
      <section
        ref={containerRef}
        className="min-h-full flex flex-col justify-start md:justify-center px-8 md:px-16 lg:px-24 pt-24 pb-24"
      >
        <div className="max-w-4xl w-full mx-auto">
          {/* Section title */}
          <div data-exp-entry className="mb-16">
            <p className="text-xs font-mono text-muted uppercase tracking-[0.3em] mb-1">Experience</p>
            <h2
              tabIndex={-1}
              translate="no"
              className="text-[clamp(2.5rem,8vw,5rem)] font-black leading-[0.85] kanji-brutal text-foreground select-none outline-none"
            >
              エクスペリエンス
            </h2>
          </div>

          {/* Work entries */}
          <div className="space-y-12 mb-16">
            {WORK_EXPERIENCE.map((entry) => (
              <div
                key={entry.company}
                data-exp-entry
                className="border-l-2 pl-6 relative"
              >
                <p className="text-xs font-mono text-muted tracking-wider">{entry.period}</p>
                <h3 className="text-lg font-bold mt-1">
                  {entry.company}
                </h3>
                <p className="text-sm text-foreground/60 mt-0.5">
                  {entry.role} — {entry.location}
                </p>
                <p className="text-xs text-foreground/50 mt-2 italic">{entry.description}</p>

                <ul className="mt-3 space-y-2">
                  {entry.highlights.map((h, i) => (
                    <li key={i} className="text-xs text-foreground/60 leading-relaxed pl-4 relative">
                      <span className="absolute left-0 text-accent-primary">&rarr;</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Organizations */}
          <div data-exp-entry>
            <p className="text-[10px] font-mono text-muted uppercase tracking-[0.2em] mb-6">Organizations</p>
            <div className="space-y-8">
              {ORGANIZATIONS.map((org) => (
                <div key={org.name} data-exp-entry className="border-l border-foreground/10 pl-6 relative">
                  <span className="absolute -left-[3px] top-1 w-1.5 h-1.5 bg-foreground/30" />
                  <p className="text-xs font-mono text-muted tracking-wider">{org.period}</p>
                  <h4 className="text-sm font-bold mt-1">{org.name}</h4>
                  <p className="text-xs text-foreground/60">
                    {org.role} — {org.location}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {org.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-foreground/60 leading-relaxed">
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
