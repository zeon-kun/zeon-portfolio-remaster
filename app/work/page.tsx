import type { Metadata } from "next";
import { PROJECTS } from "@/lib/content";

export const metadata: Metadata = {
  title: "作品 — Work | Jeong",
  description: "Selected projects — what they are, what they're built with, and where to find them.",
};

export const dynamic = "force-static";

export default function WorkPage() {
  return (
    <div className="pt-6 pb-12 px-6 md:px-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black kanji-brutal text-foreground mb-2">作品</h1>
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted">Work — {PROJECTS.length} projects</p>
        </header>

        <ul className="space-y-10">
          {PROJECTS.map((project) => (
            <li key={project.id} className="border-b border-foreground/8 pb-8">
              <div className="flex items-baseline justify-between gap-4 mb-1">
                <h2 className="text-lg heading-serif text-foreground">{project.title}</h2>
                <span className="shrink-0 text-[10px] font-mono text-muted/60 tracking-wider">{project.year}</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted mb-3">{project.tagline}</p>
              <p className="text-sm text-foreground/80 leading-relaxed mb-3">{project.description}</p>
              <p className="text-xs font-mono text-muted mb-3">{project.tech.join(" · ")}</p>
              <p className="flex gap-4 text-xs font-mono">
                {project.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary underline underline-offset-4 decoration-accent-primary/30 hover:decoration-accent-primary transition-colors"
                  >
                    {link.label} ↗
                  </a>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
