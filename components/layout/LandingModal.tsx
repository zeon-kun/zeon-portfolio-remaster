"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Calculator, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { useLang } from "@/lib/language";
import { transitionState } from "@/lib/transition";

const STORAGE_KEY = "portfolio-landing-modal-seen";
const SHOW_DELAY_MS = 700;
const EXIT_DURATION = 600;

export function LandingModal({ ready }: { ready: boolean }) {
  const lang = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const t = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [ready]);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, "1");
    }

    const overlay = overlayRef.current;
    const modal = modalRef.current;

    if (!overlay || !modal || prefersReducedMotion()) {
      setOpen(false);
      return;
    }

    gsap.to(modal, { scale: 0.96, opacity: 0, duration: 0.25, ease: "power2.in" });
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => setOpen(false),
    });
  }, []);

  const goToRatecard = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, "1");
    }

    if (prefersReducedMotion()) {
      router.push("/ratecard");
      return;
    }

    transitionState.targetHref = "/ratecard";
    transitionState.setPhase("exiting");
    setTimeout(() => router.push("/ratecard"), EXIT_DURATION);
  }, [router]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    const overlay = overlayRef.current;
    const modal = modalRef.current;
    if (!overlay || !modal) return;

    if (!prefersReducedMotion()) {
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
      gsap.fromTo(
        modal,
        { scale: 0.94, opacity: 0, y: 12 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
    }

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], [tabindex]:not([tabindex="-1"])'
    );
    const primary = modal.querySelector<HTMLElement>("[data-primary]");
    (primary ?? focusable[0])?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
        return;
      }
      if (e.key !== "Tab" || !modal || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previousFocusRef.current?.focus();
    };
  }, [open, dismiss]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) dismiss();
    },
    [dismiss]
  );

  if (!open) return null;

  const heading = lang === "jp" ? "料金表をご覧" : "Check Out the Ratecard";
  const subheading = lang === "jp" ? "Check Out the Ratecard" : "料金表をご覧";
  const body =
    lang === "jp"
      ? "プロジェクトの見積もりが知りたいですか？簡単な質問に答えるだけで、透明な複雑度スコアと料金の目安を得られます。"
      : "Curious about pricing? Paste your project brief and get a transparent complexity score plus a fee estimate in minutes.";

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="landing-modal-title"
      aria-describedby="landing-modal-body"
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 backdrop-blur-md p-4"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md border-2 border-foreground/15 bg-background p-7 md:p-9 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)]"
      >
        <span
          aria-hidden="true"
          className="absolute -top-px left-0 h-1 w-16 bg-accent-primary"
        />

        <button
          onClick={dismiss}
          aria-label={lang === "jp" ? "閉じる" : "Close"}
          className="absolute top-3 right-3 p-2 text-foreground/40 hover:text-foreground transition-colors
            focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
        >
          <X size={18} />
        </button>

        <p className="text-[10px] font-mono text-accent-primary uppercase tracking-[0.3em]">
          {lang === "jp" ? "おしらせ" : "Notice"}
        </p>

        <h2
          id="landing-modal-title"
          className="mt-3 text-2xl md:text-[28px] font-black kanji-brutal text-foreground leading-tight"
        >
          {heading}
        </h2>

        <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.2em] text-muted">
          {subheading}
        </p>

        <p
          id="landing-modal-body"
          className="mt-5 text-sm text-foreground/70 leading-relaxed"
        >
          {body}
        </p>

        <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={dismiss}
            className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest
              border border-foreground/20 text-foreground/70
              hover:border-foreground/40 hover:text-foreground
              transition-colors duration-150
              focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
          >
            {lang === "jp" ? "ポートフォリオを見る" : "Stay on Portfolio"}
          </button>

          <button
            data-primary
            onClick={goToRatecard}
            className="group flex-1 flex items-center justify-center gap-2
              px-4 py-3 text-xs font-bold uppercase tracking-widest
              bg-accent-primary text-background
              hover:scale-[1.02] active:scale-95
              transition-transform duration-150
              focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-2"
          >
            <Calculator size={14} />
            <span>{lang === "jp" ? "料金を見る" : "Go to Ratecard"}</span>
            <ArrowRight
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>
        </div>

        <p className="mt-5 text-[10px] font-mono uppercase tracking-[0.2em] text-muted/60">
          {lang === "jp" ? "後で右側のボタンからもアクセスできます" : "You can also reach it later via the side tab"}
        </p>
      </div>
    </div>
  );
}
