"use client";

import { useEffect, useState } from "react";
import { globeState } from "@/lib/globe-state";

const TIPS = [
  "Did you know? This portfolio is built with Next.js and GSAP",
  "Did you know? The globe uses 600+ calculated points",
  "Did you know? Press arrow keys to navigate slides",
  "Did you know? Reduced motion is fully supported",
  "Did you know? The kanji 路四 represents my name",
];

export function PageLoader() {
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);
  const [filling, setFilling] = useState(false);

  const [tip, setTip] = useState(TIPS[0]);

  useEffect(() => {
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    setTip(randomTip);

    // Start the progress bar fill immediately (needs a frame delay for transition to trigger)
    requestAnimationFrame(() => setFilling(true));

    const loadTimer = setTimeout(() => {
      // Start the globe morph transition
      globeState.transitionStart = performance.now();
      globeState.setPhase("transitioning");

      // Fade out the overlay text and background
      setFading(true);

      // Unmount the loader after the globe transition completes
      setTimeout(() => setLoading(false), globeState.transitionDuration);
    }, 1800);

    return () => clearTimeout(loadTimer);
  }, []);

  if (!loading) return null;

  return (
    <>
      {/* Background layer — sits BELOW the globe canvas (z-2) so globe is visible */}
      <div
        className={`
          fixed inset-0 z-1 bg-background
          transition-opacity duration-500 ease-out
          ${fading ? "opacity-0" : "opacity-100"}
        `}
        aria-hidden="true"
      />

      {/* Text/UI layer — sits ABOVE the globe canvas */}
      <div
        className={`
          fixed inset-0 z-9999 pointer-events-none
          flex flex-col items-center justify-center gap-8
          transition-opacity duration-1200 ease-out
          ${fading ? "opacity-0" : "opacity-100"}
        `}
        aria-hidden="true"
      >
        {/* Push text below the globe center position */}
        <div className="h-44" />

        <div
          className={`
            flex flex-col items-center gap-3
            transition-all duration-300 ease-out
            ${fading ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"}
          `}
        >
          <span className="text-xs font-mono text-muted tracking-[0.3em] uppercase animate-pulse">Loading</span>

          <div className="w-24 h-px bg-foreground/10 overflow-hidden">
            <div
              className={`
                h-full bg-foreground/40
                transition-all duration-1800 ease-out
                ${filling ? "w-full" : "w-0"}
              `}
            />
          </div>
        </div>

        <p
          className={`
            absolute bottom-32 text-center text-[10px] font-mono text-muted/60 max-w-xs leading-relaxed px-8
            transition-all duration-300
            ${fading ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}
          `}
        >
          {tip}
        </p>
      </div>
    </>
  );
}
