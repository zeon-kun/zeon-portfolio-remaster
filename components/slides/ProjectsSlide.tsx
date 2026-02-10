"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { PROJECTS } from "@/lib/content";
import type { Project } from "@/lib/content";
import { ProjectModal } from "./ProjectModal";
import { CatBlueprint } from "../geometric/CatBlueprint";
import { BlueprintElements } from "../geometric/GlobeBlueprint";

export function ProjectsSlide({ isActive }: { isActive: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!isActive || hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;

    if (prefersReducedMotion()) return;

    const cards = containerRef.current.querySelectorAll("[data-project-card]");
    gsap.from(cards, {
      scale: 0.95,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power3.out",
      delay: 0.3,
    });
  }, [isActive]);

  return (
    <>
      <section
        ref={containerRef}
        className="relative h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-24 pb-16 overflow-y-auto"
      >
        <div className="max-w-4xl w-full">
          {/* Section title */}
          <div className="mb-16">
            <p className="text-xs font-mono text-muted uppercase tracking-[0.3em] mb-1">Projects</p>
            <h2
              tabIndex={-1}
              translate="no"
              className="text-[clamp(2.5rem,8vw,5rem)] font-black leading-[0.85] kanji-brutal text-foreground select-none outline-none"
            >
              プロジェクト
            </h2>
          </div>

          {/* Project cards grid */}
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
      </section>

      {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </>
  );
}
