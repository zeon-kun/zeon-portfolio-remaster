"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { globeState } from "@/lib/globe-state";
import { transitionState, useTransitionPhase } from "@/lib/transition";

const TIPS = [
  "Did you know? This portfolio is built with Next.js and GSAP",
  "Did you know? The globe uses 600+ calculated points",
  "Did you know? Press arrow keys to navigate slides",
  "Did you know? Reduced motion is fully supported",
  "Did you know? The kanji 路四 represents my name",
];

const INITIAL_LOAD_DELAY = 500;
const ROUTE_LOAD_DELAY = 200;
const EXIT_FADE_DURATION = 200; // ms for overlay to fade in over current page

export function PageLoader() {
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);
  const [filling, setFilling] = useState(false);
  const [tip, setTip] = useState(TIPS[0]);

  // Exit cover: overlay fades in (opacity 0 → 1) before globe resets
  const [coverVisible, setCoverVisible] = useState(false);

  const transitionPhase = useTransitionPhase();
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  // ─── Initial page load ───
  useEffect(() => {
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    setTip(randomTip);

    requestAnimationFrame(() => setFilling(true));

    const loadTimer = setTimeout(() => {
      globeState.transitionStart = performance.now();
      globeState.setPhase("transitioning");

      setFading(true);

      setTimeout(() => setLoading(false), globeState.transitionDuration);
    }, INITIAL_LOAD_DELAY);

    return () => clearTimeout(loadTimer);
  }, []);

  // ─── Route transition step 1: fade overlay IN over current page ───
  const startExitCover = useCallback(() => {
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    setTip(randomTip);

    // Mount overlay — initially transparent
    setFading(false);
    setFilling(false);
    setCoverVisible(false);
    setLoading(true);

    // Next frame: trigger CSS transition opacity 0 → 1
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCoverVisible(true);
      });
    });

    // After overlay is fully opaque, reset globe behind it (user can't see the snap)
    setTimeout(() => {
      globeState.phase = "loading";
      requestAnimationFrame(() => setFilling(true));
    }, EXIT_FADE_DURATION);
  }, []);

  useEffect(() => {
    if (transitionPhase === "exiting") {
      startExitCover();
    }
  }, [transitionPhase, startExitCover]);

  // ─── Route transition step 2: pathname changed → new page mounted → reveal ───
  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    if (transitionState.phase !== "exiting") return;

    transitionState.setPhase("entering");

    const revealTimer = setTimeout(() => {
      globeState.transitionStart = performance.now();
      globeState.setPhase("transitioning");

      setFading(true);

      setTimeout(() => {
        setLoading(false);
        setCoverVisible(false);
        transitionState.setPhase("idle");
      }, globeState.transitionDuration);
    }, ROUTE_LOAD_DELAY);

    return () => clearTimeout(revealTimer);
  }, [pathname]);

  if (!loading) return null;

  // During exit cover phase: overlay fades from opacity-0 → opacity-1
  // During normal loader: overlay is opacity-1 (coverVisible is true or unused)
  // During fading out: overlay goes opacity-0
  const bgOpacity = fading ? "opacity-0" : coverVisible || !transitionState.targetHref ? "opacity-100" : "opacity-0";

  const textOpacity = fading ? "opacity-0" : coverVisible || !transitionState.targetHref ? "opacity-100" : "opacity-0";

  return (
    <>
      {/* Background layer — sits BELOW the globe canvas (z-2) so globe is visible */}
      <div
        className={`
          fixed inset-0 z-1 bg-background
          transition-opacity duration-500 ease-out
          ${bgOpacity}
        `}
        aria-hidden="true"
      />

      {/* Text/UI layer — sits ABOVE the globe canvas */}
      <div
        className={`
          fixed inset-0 z-9999 pointer-events-none
          flex flex-col items-center justify-center gap-8
          transition-opacity duration-700 ease-out
          ${textOpacity}
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
