"use client";

import { useState } from "react";
import { Home, User, Briefcase, FolderGit, Linkedin, Github } from "lucide-react";
import { SlideId } from "@/components/slides/SlideContainer";

const NAV_LINKS = [
  { id: "hero" as SlideId, label: "ホーム", icon: Home, translation: "Home" },
  { id: "about" as SlideId, label: "アバウト", icon: User, translation: "About" },
  { id: "experience" as SlideId, label: "エクスペリエンス", icon: Briefcase, translation: "Experience" },
  { id: "projects" as SlideId, label: "プロジェクト", icon: FolderGit, translation: "Projects" },
] as const;

const SOCIAL_LINKS = [
  { label: "リンクトイン", href: "https://linkedin.com", icon: Linkedin, translation: "LinkedIn" },
  { label: "ギットハブ", href: "https://github.com", icon: Github, translation: "GitHub" },
] as const;

interface NavbarProps {
  activeSlide: SlideId;
  onNavigate: (id: SlideId) => void;
}

export function Navbar({ activeSlide, onNavigate }: NavbarProps) {
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);
  const [hoveredCta, setHoveredCta] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-5">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo - left */}
        <a
          href="/"
          translate="no"
          className="flex items-center gap-1 text-2xl font-black tracking-tight kanji-brutal hover:text-accent-primary transition-colors"
        >
          <span className="text-foreground">路四</span>
        </a>

        {/* Center group - Slide navigation */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-foreground/10 bg-background/60 backdrop-blur-md">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = activeSlide === link.id;
              const isHovered = hoveredNav === link.label;

              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  onMouseEnter={() => setHoveredNav(link.label)}
                  onMouseLeave={() => setHoveredNav(null)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-xl
                    text-xs font-bold tracking-wider
                    transition-colors duration-150 ease-out
                    ${
                      isActive
                        ? "bg-accent-primary text-background"
                        : "text-muted hover:text-foreground hover:bg-foreground/5"
                    }
                  `}
                >
                  <Icon size={14} className={isActive ? "opacity-100" : "opacity-70"} />
                  <span className="font-jp">{link.label}</span>

                  {/* Tooltip */}
                  <span
                    className={`
                      absolute left-1/2 -translate-x-1/2 top-full mt-2 
                      px-2 py-1 
                      text-[10px] font-mono font-normal tracking-wider uppercase
                      bg-foreground text-background 
                      rounded whitespace-nowrap
                      transition-all duration-200
                      pointer-events-none z-50
                      ${isHovered && !isActive ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}
                    `}
                  >
                    {link.translation}
                    <span className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-foreground rotate-45" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right group - Social + CTA */}
        <div className="flex items-center gap-4">
          {/* Social links */}
          <div className="hidden lg:flex items-center gap-1">
            {SOCIAL_LINKS.map((link) => {
              const Icon = link.icon;
              const isHovered = hoveredSocial === link.label;

              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setHoveredSocial(link.label)}
                  onMouseLeave={() => setHoveredSocial(null)}
                  className="relative flex items-center justify-center w-10 h-10 rounded-xl text-muted hover:text-foreground hover:bg-foreground/5 transition-all duration-200"
                >
                  <Icon size={16} />

                  {/* Tooltip */}
                  <span
                    className={`
                      absolute left-1/2 -translate-x-1/2 top-full mt-2 
                      px-2 py-1 
                      text-[10px] font-mono font-normal tracking-wider uppercase
                      bg-foreground text-background 
                      rounded whitespace-nowrap
                      transition-all duration-200
                      pointer-events-none z-50
                      ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}
                    `}
                  >
                    {link.translation}
                    <span className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-foreground rotate-45" />
                  </span>
                </a>
              );
            })}
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-6 bg-foreground/10" />

          {/* CTA Button */}
          <a
            href="mailto:hello@example.com"
            onMouseEnter={() => setHoveredCta(true)}
            onMouseLeave={() => setHoveredCta(false)}
            className="relative rounded-xl bg-accent-primary text-background px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-accent-primary/20"
          >
            <span className="font-jp">繋がりましょう !</span>

            {/* Tooltip */}
            <span
              className={`
                absolute left-1/2 -translate-x-1/2 top-full mt-3
                px-3 py-1.5
                text-[10px] font-mono font-normal tracking-wider uppercase
                bg-foreground text-background 
                rounded whitespace-nowrap
                transition-all duration-200
                pointer-events-none z-50
                ${hoveredCta ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}
              `}
            >
              Let&apos;s Connect
              <span className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-foreground rotate-45" />
            </span>
          </a>
        </div>
      </div>
    </nav>
  );
}
