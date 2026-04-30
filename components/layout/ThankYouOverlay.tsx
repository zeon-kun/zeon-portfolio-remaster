"use client";

import { useEffect, useState } from "react";

const ENTER_MS = 1000;
const EXIT_MS = 1000;

export function ThankYouOverlay({ show }: { show: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(raf);
    }

    setActive(false);
    const t = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(t);
  }, [show]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!show}
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      style={{
        backgroundColor: active ? "rgba(245, 240, 235, 0.45)" : "rgba(245, 240, 235, 0)",
        backdropFilter: active ? "blur(28px) saturate(120%)" : "blur(0px) saturate(100%)",
        WebkitBackdropFilter: active ? "blur(28px) saturate(120%)" : "blur(0px) saturate(100%)",
        transition: `background-color ${active ? ENTER_MS : EXIT_MS}ms ease-out, backdrop-filter ${active ? ENTER_MS : EXIT_MS}ms ease-out, -webkit-backdrop-filter ${active ? ENTER_MS : EXIT_MS}ms ease-out`,
      }}
    >
      <div
        className="text-center px-8"
        style={{
          opacity: active ? 1 : 0,
          transform: active ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
          transition: `opacity ${active ? ENTER_MS : EXIT_MS}ms ease-out, transform ${active ? ENTER_MS : EXIT_MS}ms ease-out`,
        }}
      >
        <p className="text-[10px] font-mono text-muted uppercase tracking-[0.4em] mb-4">
          Downloading CV
        </p>
        <h2
          translate="no"
          className="text-[clamp(3rem,10vw,7rem)] font-black leading-[0.85] kanji-brutal text-foreground select-none"
        >
          ありがとう
        </h2>
        <p className="mt-6 text-sm md:text-base text-foreground/70">
          Thank you for your interest.
        </p>
      </div>
    </div>
  );
}
