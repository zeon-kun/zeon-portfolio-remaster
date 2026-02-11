"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/lib/motion";
import { BlueprintElements } from "@/components/geometric/GlobeBlueprint";
import { Cat, Code2, Coffee } from "lucide-react";

gsap.registerPlugin(useGSAP);

const EXPERIENCE = [
  { company: "Huawei", location: "Jakarta, Indonesia" },
  { company: "DPTSI ITS", location: "Surabaya, Indonesia" },
  { company: "Bangkit Academy", location: "Indonesia" },
];

const COMPANIES = ["Huawei", "Indosat", "Nokia", "Deloitte", "Google"];

const TYPEWRITER_PHRASES = [
  "Full Stack Developer",
  "Cloud Engineer (GCP)",
  "Backend Developer",
  "Based in Indonesia",
  "ITS Informatics '25",
];

function useTypewriter(phrases: string[], typeSpeed = 60, deleteSpeed = 30, pauseMs = 2000) {
  const [text, setText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tick = useCallback(() => {
    const current = phrases[phraseIdx];

    if (!isDeleting) {
      // Typing
      const next = current.slice(0, text.length + 1);
      setText(next);

      if (next === current) {
        // Done typing — pause then start deleting
        timeoutRef.current = setTimeout(() => setIsDeleting(true), pauseMs);
        return;
      }
      timeoutRef.current = setTimeout(tick, typeSpeed);
    } else {
      // Deleting
      const next = current.slice(0, text.length - 1);
      setText(next);

      if (next === "") {
        setIsDeleting(false);
        setPhraseIdx((prev) => (prev + 1) % phrases.length);
        timeoutRef.current = setTimeout(tick, typeSpeed);
        return;
      }
      timeoutRef.current = setTimeout(tick, deleteSpeed);
    }
  }, [text, phraseIdx, isDeleting, phrases, typeSpeed, deleteSpeed, pauseMs]);

  useEffect(() => {
    timeoutRef.current = setTimeout(tick, typeSpeed);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [tick, typeSpeed]);

  return text;
}

export function HeroSlide({ isActive }: { isActive: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const typewriterText = useTypewriter(TYPEWRITER_PHRASES);

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set("[data-hero-kanji]", { clearProps: "all" });
        gsap.set("[data-hero-name] span", { clearProps: "all" });
        gsap.set("[data-hero-meta]", { clearProps: "all" });
        gsap.set("[data-crosshair-label]", { clearProps: "all" });
        gsap.set("[data-divider]", { clearProps: "all" });
        gsap.set("[data-company]", { clearProps: "all" });
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out", duration: 0.8 },
      });

      tl.from("[data-hero-kanji]", {
        yPercent: 100,
        duration: 1.2,
        ease: "expo.out",
      });

      tl.from(
        "[data-hero-name] span",
        {
          yPercent: 100,
          duration: 1,
          stagger: 0.08,
          ease: "expo.out",
        },
        "-=0.6"
      );

      tl.from(
        "[data-hero-meta]",
        {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
        },
        "-=0.6"
      );

      tl.from(
        "[data-crosshair-label]",
        {
          opacity: 0,
          duration: 0.6,
        },
        "-=0.4"
      );

      tl.from(
        "[data-divider]",
        {
          scaleX: 0,
          transformOrigin: "left",
          duration: 1,
          ease: "power2.inOut",
        },
        "-=0.4"
      );

      tl.from(
        "[data-company]",
        {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
        },
        "-=0.4"
      );
    },
    { scope: containerRef }
  );

  return (
    <>
      <section
        ref={containerRef}
        className="relative h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-48 md:pt-24 pb-16 overflow-hidden"
      >
        <div className="flex-1 flex flex-col justify-center max-w-4xl">
          <div className="space-y-2">
            <div className="overflow-hidden">
              <h1
                data-hero-kanji
                translate="no"
                tabIndex={-1}
                className="text-[clamp(5rem,20vw,16rem)] font-black leading-[0.85] kanji-brutal text-foreground outline-none"
              >
                路四
              </h1>
            </div>

            <div className="overflow-hidden pl-2">
              <h1
                data-hero-name
                className="text-[clamp(1.5rem,4vw,3rem)] font-bold tracking-[0.3em] text-foreground/60 uppercase"
              >
                {"Jeong".split("").map((char, i) => (
                  <span key={i} className="inline-block overflow-hidden">
                    <span className="inline-block">{char}</span>
                  </span>
                ))}
              </h1>
            </div>
          </div>

          <div className="mt-12 flex flex-col md:flex-row md:items-start md:justify-between gap-8 max-w-3xl pl-2">
            <div data-hero-meta className="space-y-2">
              <p className="text-sm font-mono text-foreground/70 tracking-wide h-6">
                {typewriterText}
                <span className="inline-block w-[2px] h-[1em] bg-accent-primary ml-0.5 align-middle animate-[blink_1s_step-end_infinite]" />
              </p>
            </div>

            <div data-hero-meta className="space-y-4">
              <p className="text-[10px] font-mono text-muted uppercase tracking-[0.2em] border-b border-foreground/10 pb-2">
                Experience
              </p>
              {EXPERIENCE.map((exp) => (
                <div key={exp.company} className="flex items-baseline gap-4 group cursor-pointer">
                  <span className="text-sm font-bold group-hover:text-accent-primary transition-colors duration-300">
                    → {exp.company}
                  </span>
                  <span className="text-xs text-muted font-mono tracking-wider">{exp.location}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div data-divider className="w-full max-w-4xl h-px bg-foreground/10 mt-16 mb-10 ml-2" />

        <div className="flex flex-col md:flex-row md:items-center gap-6 max-w-4xl pl-2">
          <div data-hero-meta className="text-xs font-mono text-muted uppercase tracking-widest whitespace-nowrap">
            <div
              data-hero-meta
              className="flex items-center gap-4 text-[10px] font-mono text-muted uppercase tracking-[0.2em] whitespace-nowrap"
            >
              <div className="flex items-center gap-1.5 group">
                <Code2 size={12} className="text-accent-primary transition-colors group-hover:text-foreground" />
                <span>Code</span>
              </div>

              <span className="opacity-30">•</span>

              <div className="flex items-center gap-1.5 group">
                <Coffee size={12} className="text-accent-primary transition-colors group-hover:text-foreground" />
                <span>Coffee</span>
              </div>

              <span className="opacity-30">•</span>

              <div className="flex items-center gap-1.5 group">
                <Cat size={12} className="text-accent-primary transition-colors group-hover:text-foreground" />
                <span>Cats</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-8">
            {COMPANIES.map((company) => (
              <span
                key={company}
                data-company
                className="text-sm font-bold text-foreground/40 transition-all duration-300 hover:text-foreground hover:tracking-wider cursor-pointer"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
