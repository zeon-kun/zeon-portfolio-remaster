"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { PROJECTS } from "@/lib/content";
import type { Project } from "@/lib/content";
import { ProjectModal } from "./ProjectModal";
import { globeState } from "@/lib/globe-state";
import { Orbit, LayoutGrid } from "lucide-react";

export function ProjectsSlide({ isActive }: { isActive: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const planetariumRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isPlanetarium, setIsPlanetarium] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Track both views during transition
  const [showingView, setShowingView] = useState<"planetarium" | "cards">("planetarium");

  const handlePlanetClick = useCallback((index: number) => {
    if (index >= 0 && index < PROJECTS.length) {
      setSelectedProject(PROJECTS[index]);
    }
  }, []);

  useEffect(() => {
    globeState.onProjectClick = handlePlanetClick;
    return () => {
      if (globeState.onProjectClick === handlePlanetClick) {
        globeState.onProjectClick = null;
      }
    };
  }, [handlePlanetClick]);

  useEffect(() => {
    globeState.showPlanetarium = isPlanetarium;
  }, [isPlanetarium]);

  useEffect(() => {
    if (isActive) {
      globeState.showPlanetarium = isPlanetarium;
    }
  }, [isActive, isPlanetarium]);

  const toggleView = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const newMode = !isPlanetarium;
    setSelectedProject(null);

    if (prefersReducedMotion()) {
      setIsPlanetarium(newMode);
      setShowingView(newMode ? "planetarium" : "cards");
      setIsTransitioning(false);
      return;
    }

    // Exit animation
    const currentRef = isPlanetarium ? planetariumRef.current : cardsRef.current;
    const exitTl = gsap.timeline();

    // Animate out current view
    exitTl.to(currentRef, {
      opacity: 0,
      scale: 0.95,
      y: isPlanetarium ? -20 : 20,
      duration: 0.35,
      ease: "power2.in",
    });

    // Switch state mid-transition
    exitTl.call(() => {
      setIsPlanetarium(newMode);
      setShowingView(newMode ? "planetarium" : "cards");
    });

    // Enter animation
    const enterRef = newMode ? planetariumRef.current : cardsRef.current;

    exitTl.fromTo(
      enterRef,
      {
        opacity: 0,
        scale: 1.05,
        y: newMode ? 20 : -20,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        onComplete: () => setIsTransitioning(false),
      }
    );
  }, [isPlanetarium, isTransitioning]);

  // Entrance animation
  useEffect(() => {
    if (!isActive || hasAnimated.current) return;
    hasAnimated.current = true;

    if (prefersReducedMotion()) return;

    const tl = gsap.timeline({ delay: 0.2 });

    tl.from("[data-title-section]", {
      opacity: 0,
      x: -30,
      duration: 0.7,
      ease: "power3.out",
    }).from(
      "[data-content-panel]",
      {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: "power2.out",
      },
      "-=0.2"
    );
  }, [isActive]);

  const handleCloseModal = useCallback(() => {
    setSelectedProject(null);
  }, []);

  return (
    <>
      {/* ─── PLANETARIUM LAYOUT ─── */}
      <section
        ref={planetariumRef}
        className={`absolute inset-0 h-full flex flex-col md:flex-row pt-24 pb-16 overflow-hidden transition-none ${
          showingView === "planetarium" ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{ opacity: isPlanetarium ? 1 : 0 }}
      >
        {/* LEFT PANEL — 50% */}
        <div className="w-full md:w-1/2 px-8 md:px-16 lg:px-24 flex flex-col relative z-30 h-full">
          {/* Header + toggle */}
          <div data-title-section className="mb-10 flex items-center justify-between gap-6 whitespace-nowrap">
            <div className="min-w-0">
              <p className="text-[10px] font-mono text-muted uppercase tracking-[0.3em] mb-2">Projects</p>
              <h2
                tabIndex={-1}
                translate="no"
                className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[0.9] kanji-brutal text-foreground select-none outline-none"
              >
                プロジェクト
              </h2>
            </div>

            <button
              data-toggle-btn
              onClick={toggleView}
              disabled={isTransitioning}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest border-2 border-foreground/20 text-muted hover:text-foreground hover:border-accent-primary hover:bg-accent-primary/5 transition-all duration-200 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
          </div>

          {/* Content — inline modal or hint */}
          <div data-content-panel className="flex-1 overflow-y-auto">
            {/* Desktop: planetarium hint / inline modal */}
            <div className="hidden md:block">
              {!selectedProject ? (
                <p className="text-xs font-mono text-muted/60 tracking-wider">Click a planet to view details</p>
              ) : (
                <ProjectModal project={selectedProject} onClose={handleCloseModal} inline={true} />
              )}
            </div>

            {/* Mobile fallback: always show cards */}
            <div className="md:hidden">
              <div className="grid grid-cols-1 gap-6">
                {PROJECTS.map((project) => (
                  <button
                    key={project.id}
                    data-project-card
                    onClick={() => setSelectedProject(project)}
                    className="text-left border-2 border-foreground/10 p-6 hover:border-accent-primary transition-colors duration-200 group"
                  >
                    <p className="text-xs font-mono text-accent-primary tracking-wider">{project.year}</p>
                    <p className="text-lg font-bold mt-2 group-hover:text-accent-primary transition-colors">
                      {project.title}
                    </p>
                    <p className="text-xs text-foreground/50 mt-2 leading-relaxed">{project.tagline}</p>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {project.tech.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 text-[10px] font-mono border border-foreground/8 text-foreground/40"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — 50% spacer for globe */}
        <div className="hidden md:block w-1/2 relative h-full" />

        {/* Mobile fullscreen modal */}
        {selectedProject && (
          <div className="md:hidden">
            <ProjectModal project={selectedProject} onClose={handleCloseModal} />
          </div>
        )}
      </section>

      {/* ─── CARDS LAYOUT ─── */}
      <section
        ref={cardsRef}
        className={`absolute inset-0 min-h-full flex flex-col justify-start md:justify-center px-8 md:px-16 lg:px-24 pt-24 pb-24 md:pb-16 transition-none ${
          showingView === "cards" ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{ opacity: !isPlanetarium ? 1 : 0 }}
      >
        <div className="max-w-4xl w-full">
          {/* Header + toggle */}
          <div data-title-section className="mb-16 flex items-center justify-between gap-6">
            <div className="min-w-0">
              <p className="text-xs font-mono text-muted uppercase tracking-[0.3em] mb-1">Projects</p>
              <h2
                tabIndex={-1}
                translate="no"
                className="text-[clamp(2.5rem,8vw,5rem)] font-black leading-[0.85] kanji-brutal text-foreground select-none outline-none"
              >
                プロジェクト
              </h2>
            </div>

            <button
              data-toggle-btn
              onClick={toggleView}
              disabled={isTransitioning}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest border-2 border-foreground/20 text-muted hover:text-foreground hover:border-accent-primary hover:bg-accent-primary/5 transition-all duration-200 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Orbit size={14} />
              <span>Orbit</span>
            </button>
          </div>

          {/* Cards grid */}
          <div data-content-panel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PROJECTS.map((project) => (
                <button
                  key={project.id}
                  data-project-card
                  onClick={() => setSelectedProject(project)}
                  className="text-left border-2 border-foreground/10 p-6 hover:border-accent-primary transition-colors duration-200 group"
                >
                  <p className="text-xs font-mono text-accent-primary tracking-wider">{project.year}</p>
                  <p className="text-lg font-bold mt-2 group-hover:text-accent-primary transition-colors">
                    {project.title}
                  </p>
                  <p className="text-xs text-foreground/50 mt-2 leading-relaxed">{project.tagline}</p>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {project.tech.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-[10px] font-mono border border-foreground/8 text-foreground/40"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fullscreen centered modal */}
        {selectedProject && <ProjectModal project={selectedProject} onClose={handleCloseModal} />}
      </section>
    </>
  );
}
