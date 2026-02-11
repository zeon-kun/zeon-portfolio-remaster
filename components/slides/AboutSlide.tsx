"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { PERSONAL_INFO, SKILLS, CERTIFICATIONS } from "@/lib/content";
import { BlueprintElements } from "../geometric/GlobeBlueprint";

export function AboutSlide({ isActive }: { isActive: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isActive || hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;

    if (prefersReducedMotion()) return;

    const blocks = containerRef.current.querySelectorAll("[data-about-block]");
    gsap.from(blocks, {
      y: 40,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: "power3.out",
      delay: 0.3,
    });
  }, [isActive]);

  return (
    <>
      <section
        ref={containerRef}
        className="min-h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-32 pb-24"
      >
        <div className="max-w-4xl w-full mx-auto">
          {/* Section title */}
          <div data-about-block className="mb-16">
            <p className="text-xs font-mono text-muted uppercase tracking-[0.3em] mt-2">About Me</p>
            <h2
              tabIndex={-1}
              translate="no"
              className="text-[clamp(3rem,10vw,7rem)] font-black leading-[0.85] kanji-brutal text-foreground select-none outline-none"
            >
              私について
            </h2>
          </div>

          {/* Intro */}
          <p data-about-block className="text-base leading-relaxed text-foreground/70 max-w-2xl mb-16">
            {PERSONAL_INFO.summary}
          </p>

          {/* Education */}
          <div data-about-block className="mb-16 border-l-2 pl-6">
            <p className="text-[10px] font-mono text-muted uppercase tracking-[0.2em] mb-4">Education</p>
            <p className="text-lg font-bold">{PERSONAL_INFO.education.institution}</p>
            <p className="text-sm text-foreground/70 mt-1">{PERSONAL_INFO.education.degree}</p>
            <div className="flex items-baseline gap-4 mt-2">
              <span className="text-sm font-mono text-accent-primary">{PERSONAL_INFO.education.gpa}</span>
              <span className="text-xs font-mono text-muted">{PERSONAL_INFO.education.period}</span>
            </div>
            <ul className="mt-4 space-y-2">
              {PERSONAL_INFO.education.highlights.map((h, i) => (
                <li key={i} className="text-xs text-foreground/50 leading-relaxed">
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Skills grid */}
          <div data-about-block className="mb-16">
            <p className="text-[10px] font-mono text-muted uppercase tracking-[0.2em] mb-6">Skills</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {SKILLS.map((category) => (
                <div key={category.label}>
                  <p className="text-xs font-mono font-bold uppercase tracking-widest text-foreground/40 mb-3">
                    {category.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.items.map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1 text-xs font-medium border border-foreground/10 text-foreground/70"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div data-about-block>
            <p className="text-[10px] font-mono text-muted uppercase tracking-[0.2em] mb-4">Certifications</p>
            <div className="space-y-3">
              {CERTIFICATIONS.map((cert) => (
                <div key={cert.title} className="flex items-baseline gap-4">
                  <span className="text-xs font-mono text-accent-primary">{cert.year}</span>
                  <span className="text-sm font-medium">{cert.title}</span>
                  <span className="text-xs text-muted font-mono">{cert.issuer}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
