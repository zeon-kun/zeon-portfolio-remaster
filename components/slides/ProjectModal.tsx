"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import type { Project } from "@/lib/content";
import { X } from "lucide-react";

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
  inline?: boolean;
}

export function ProjectModal({ project, onClose, inline = false }: ProjectModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    const modal = modalRef.current;
    if (!modal) return;

    if (inline) {
      // Inline: simple fade-in
      if (!prefersReducedMotion()) {
        gsap.fromTo(modal, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
      }
      const closeBtn = modal.querySelector("[data-close-btn]") as HTMLElement;
      closeBtn?.focus();
    } else {
      // Fullscreen: scale entrance + focus trap
      if (!prefersReducedMotion()) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
        gsap.fromTo(modal, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "power3.out" });
      }
      const focusable = modal.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])');
      if (focusable.length) focusable[0].focus();
    }

    function trapFocus(e: KeyboardEvent) {
      if (inline || e.key !== "Tab" || !modal) return;
      const focusableEls = modal.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])');
      if (!focusableEls.length) return;
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", trapFocus);
    return () => {
      document.removeEventListener("keydown", trapFocus);
      previousFocusRef.current?.focus();
    };
  }, [inline]);

  // Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose]
  );

  // ─── INLINE MODE — compact card for planetarium left panel ───
  if (inline) {
    return (
      <div
        ref={modalRef}
        className="relative w-full border-2 border-accent-primary/30 bg-background/80 backdrop-blur-sm p-5"
      >
        <button
          data-close-btn
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 text-foreground/30 hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>

        <p className="text-[10px] font-mono text-accent-primary tracking-wider">{project.year}</p>
        <h3 className="text-lg font-black mt-1 pr-6">{project.title}</h3>
        <p className="text-xs text-foreground/60 italic mt-1">{project.tagline}</p>
        <p className="text-sm text-foreground/70 leading-relaxed mt-3 line-clamp-4">{project.description}</p>

        <div className="mt-4">
          <div className="flex flex-wrap gap-1.5">
            {project.tech.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-[10px] font-mono border border-accent-primary/30 text-accent-primary/80"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {project.links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-foreground/20 text-foreground/70 hover:border-accent-primary hover:text-accent-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── FULLSCREEN MODE — centered popup with blur ───
  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-60 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto border-4 border-foreground/20 bg-background p-8 md:p-12"
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-foreground/40 hover:text-foreground transition-colors"
        >
          <X size={20} />
        </button>

        <p className="text-xs font-mono text-accent-primary tracking-wider">{project.year}</p>
        <h3 className="text-2xl font-black mt-2">{project.title}</h3>
        <p className="text-sm text-foreground/60 leading-relaxed mt-6">{project.description}</p>

        <div className="mt-8">
          <p className="text-[10px] font-mono text-muted uppercase tracking-[0.2em] mb-3">Stack</p>
          <div className="flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <span
                key={t}
                className="px-3 py-1 text-xs font-medium border border-accent-primary/30 text-accent-primary"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {project.links.length > 0 && (
          <div className="mt-8 flex gap-4">
            {project.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 text-xs font-bold uppercase tracking-widest border-2 border-foreground/20 text-foreground hover:border-accent-primary hover:text-accent-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
