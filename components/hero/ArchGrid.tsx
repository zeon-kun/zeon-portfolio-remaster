"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(useGSAP);

export function ArchGrid() {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set("[data-grid-line]", { clearProps: "all" });
        gsap.set("[data-grid-h]", { clearProps: "all" });
        gsap.set("[data-grid-v]", { clearProps: "all" });
        gsap.set("[data-jp-text]", { clearProps: "all" });
        return;
      }

      gsap.from("[data-grid-line]", {
        opacity: 0,
        duration: 1.2,
        stagger: 0.05,
        delay: 0.3,
        ease: "power2.out",
      });

      gsap.from("[data-grid-h]", {
        scaleX: 0,
        transformOrigin: "left",
        duration: 1.4,
        stagger: 0.08,
        delay: 0.2,
        ease: "power3.out",
      });

      gsap.from("[data-grid-v]", {
        scaleY: 0,
        transformOrigin: "top",
        duration: 1.4,
        stagger: 0.08,
        delay: 0.2,
        ease: "power3.out",
      });

      // Brutalist Japanese text animation
      gsap.from("[data-jp-text]", {
        opacity: 0,
        x: -30,
        duration: 1.2,
        delay: 1,
        stagger: 0.2,
        ease: "power3.out",
      });
    },
    { scope: gridRef }
  );

  return (
    <div ref={gridRef} className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Vertical structural lines */}
      <div data-grid-line data-grid-v className="absolute left-[8%] top-0 w-px h-full bg-foreground/4" />
      <div data-grid-line data-grid-v className="absolute left-[25%] top-0 w-px h-full bg-foreground/4" />
      <div data-grid-line data-grid-v className="absolute left-[50%] top-0 w-px h-full bg-foreground/3" />
      <div data-grid-line data-grid-v className="absolute left-[75%] top-0 w-px h-full bg-foreground/4" />
      <div data-grid-line data-grid-v className="absolute right-[8%] top-0 w-px h-full bg-foreground/4" />

      {/* Horizontal structural lines */}
      <div data-grid-line data-grid-h className="absolute top-[12%] left-0 w-full h-px bg-foreground/4" />
      <div data-grid-line data-grid-h className="absolute top-[38%] left-0 w-full h-px bg-foreground/3" />
      <div data-grid-line data-grid-h className="absolute top-[72%] left-0 w-full h-px bg-foreground/4" />
      <div data-grid-line data-grid-h className="absolute bottom-[12%] left-0 w-full h-px bg-foreground/4" />

      {/* LEFT SIDE - Software/Code related vertical text */}
      {/* <div
        data-jp-text
        translate="no"
        className="absolute left-4 md:left-8 top-[12%] writing-vertical text-5xl md:text-7xl font-black text-foreground/8 kanji-brutal select-none"
      >
        コード創造
      </div> */}

      {/* LEFT SIDE - Middle: Algorithm/Data */}
      <div
        data-jp-text
        translate="no"
        className="absolute left-4 md:left-8 top-[45%] writing-vertical text-2xl md:text-3xl font-bold text-foreground/15 kanji-brutal select-none"
      >
        アルゴリズム
      </div>

      {/* LEFT SIDE - Bottom: Design/System */}
      <div
        data-jp-text
        translate="no"
        className="absolute left-4 md:left-8 bottom-[12%] writing-vertical text-xl md:text-2xl font-bold text-foreground/20 kanji-brutal select-none"
      >
        設計思想
      </div>

      {/* RIGHT SIDE - Engineering/Build related */}
      <div
        data-jp-text
        translate="no"
        className="absolute right-4 md:right-8 top-[15%] writing-vertical text-4xl md:text-6xl font-black text-foreground/8 kanji-brutal select-none"
      >
        工学建築
      </div>

      {/* RIGHT SIDE - Bottom: Digital/Creation */}
      <div
        data-jp-text
        translate="no"
        className="absolute right-4 md:right-8 bottom-[15%] writing-vertical text-lg md:text-xl font-bold text-foreground/25 kanji-brutal select-none tracking-widest"
      >
        デジタル創世記
      </div>

      {/* Corner markers */}
      <span className="absolute top-[12%] left-[8%] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-foreground/20 rounded-full" />
      <span className="absolute top-[12%] right-[8%] translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-foreground/20 rounded-full" />
      <span className="absolute bottom-[12%] left-[8%] -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-foreground/20 rounded-full" />
      <span className="absolute bottom-[12%] right-[8%] translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-foreground/20 rounded-full" />
    </div>
  );
}
