"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

const STORAGE_KEY = "gesture-hint-seen";

export function GestureHint() {
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const isTouchDevice = useRef(false);

  // Phase 1: decide whether to show
  useEffect(() => {
    // const forceDebug = new URLSearchParams(window.location.search).has("debug-hint");
    // if (!forceDebug && sessionStorage.getItem(STORAGE_KEY)) return;
    // isTouchDevice.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    // if (!forceDebug) sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(true);
  }, []);

  // Phase 2: animate once the DOM element is mounted
  useEffect(() => {
    if (!visible) return;
    const bar = barRef.current;
    if (!bar) return;

    const reduced = prefersReducedMotion();

    if (!reduced) {
      gsap.fromTo(bar, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", delay: 2 });

      gsap.to(bar, {
        y: 10,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        delay: 6,
        onComplete: () => setVisible(false),
      });
    } else {
      gsap.set(bar, { opacity: 1 });
      const timeout = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 opacity-0 pointer-events-none"
    >
      <div className="flex items-center gap-3 px-5 py-2.5 border border-foreground/10 bg-background/90 backdrop-blur-sm">
        <span className="w-1 h-1 bg-accent-primary" />
        <p className="text-[10px] font-mono text-foreground/40 uppercase tracking-[0.15em] whitespace-nowrap">
          {isTouchDevice.current ? "Swipe to navigate sections" : "Scroll or use arrow keys to navigate"}
        </p>
        <span className="w-1 h-1 bg-accent-primary" />
      </div>
    </div>
  );
}
