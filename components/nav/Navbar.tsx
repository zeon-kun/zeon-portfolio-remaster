"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Home, User, Briefcase, FolderGit, Linkedin, Github, Mail, GitCommitHorizontal, BookOpen, MoreHorizontal, Globe } from "lucide-react";
import type { SlideId } from "@/components/slides/SlideContainer";
import { useLang, langState } from "@/lib/language";
import { globeState, useGlobeVisible } from "@/lib/globe-state";
import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/layout/TransitionLink";

const NAV_LINKS = [
  { id: "hero" as SlideId, label: "ホーム", icon: Home, translation: "Home" },
  { id: "about" as SlideId, label: "アバウト", icon: User, translation: "About" },
  { id: "experience" as SlideId, label: "エクスペリエンス", icon: Briefcase, translation: "Experience" },
  { id: "projects" as SlideId, label: "プロジェクト", icon: FolderGit, translation: "Projects" },
] as const;

const ROUTE_LINKS = [
  { href: "/changelog", label: "変更履歴", icon: GitCommitHorizontal, translation: "Changelog" },
  { href: "/blog", label: "ブログ", icon: BookOpen, translation: "Blog" },
] as const;

const SOCIAL_LINKS = [
  {
    label: "メール",
    href: "mailto:rafif.zeon@gmail.com",
    icon: Mail,
    translation: "Email",
    external: false,
  },
  { label: "ギットハブ", href: "https://github.com/zeon-kun", icon: Github, translation: "GitHub", external: true },
] as const;

// ─── Slides mode (used by SlideContainer on home page) ───
interface SlideNavbarProps {
  mode?: "slides";
  activeSlide: SlideId;
  onNavigate: (id: SlideId) => void;
  loaderVisible?: boolean;
}

// ─── Routes mode (used by PageOverlays on /changelog, /blog, etc.) ───
interface RouteNavbarProps {
  mode: "routes";
  activeSlide?: never;
  onNavigate?: never;
  loaderVisible?: boolean;
}

type NavbarProps = SlideNavbarProps | RouteNavbarProps;

export function Navbar(props: NavbarProps) {
  const { loaderVisible } = props;
  const mode = props.mode ?? "slides";
  const lang = useLang();
  const pathname = usePathname();
  const globeVisible = useGlobeVisible();
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);
  const [hoveredCta, setHoveredCta] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close "more" popup on outside click
  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [moreOpen]);

  const closeMore = useCallback(() => setMoreOpen(false), []);

  const isRouteMode = mode === "routes";
  const activeSlide = isRouteMode ? undefined : props.activeSlide;
  const onNavigate = isRouteMode ? undefined : props.onNavigate;

  return (
    <>
      {/* ─── Desktop top bar ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 px-8 py-5 hidden md:block transition-all duration-700 ease-out ${loaderVisible ? "opacity-0 blur-sm" : "opacity-100 blur-0"}`}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          {isRouteMode ? (
            <TransitionLink
              href="/"
              translate="no"
              className="flex items-center gap-1 text-2xl font-black tracking-tight kanji-brutal hover:text-accent-primary transition-colors"
            >
              <span className="text-foreground">路四</span>
            </TransitionLink>
          ) : (
            <button
              onClick={() => onNavigate?.("hero")}
              translate="no"
              className="flex items-center gap-1 text-2xl font-black tracking-tight kanji-brutal hover:text-accent-primary transition-colors"
            >
              <span className="text-foreground">路四</span>
            </button>
          )}

          {/* Center group - Navigation */}
          <div className="flex items-center">
            <div className="flex items-center gap-1 px-2 py-1.5 border border-foreground/10 bg-background/60 backdrop-blur-md">
              {/* Slide nav items */}
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = !isRouteMode && activeSlide === link.id;
                const isHovered = hoveredNav === link.label;
                const displayLabel = lang === "jp" ? link.label : link.translation.toUpperCase();

                if (isRouteMode) {
                  return (
                    <TransitionLink
                      key={link.id}
                      href={link.id === "hero" ? "/" : `/#${link.id}`}
                      onMouseEnter={() => setHoveredNav(link.label)}
                      onMouseLeave={() => setHoveredNav(null)}
                      className="relative flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider transition-colors duration-150 ease-out text-muted hover:text-foreground hover:bg-foreground/5"
                    >
                      <Icon size={14} className="opacity-70" />
                      <span className={lang === "jp" ? "font-jp" : "font-mono"}>{displayLabel}</span>
                      {lang === "jp" && (
                        <span
                          className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 text-[10px] font-mono font-normal tracking-wider uppercase bg-foreground text-background whitespace-nowrap transition-all duration-200 pointer-events-none z-50 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
                        >
                          {link.translation}
                          <span className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-foreground rotate-45" />
                        </span>
                      )}
                    </TransitionLink>
                  );
                }

                return (
                  <button
                    key={link.id}
                    onClick={() => onNavigate?.(link.id)}
                    onMouseEnter={() => setHoveredNav(link.label)}
                    onMouseLeave={() => setHoveredNav(null)}
                    aria-current={isActive ? "page" : undefined}
                    className={`
                      relative flex items-center gap-2 px-4 py-2
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
                    <span className={lang === "jp" ? "font-jp" : "font-mono"}>{displayLabel}</span>

                    {/* Tooltip — suppress when lang is EN (tooltip = same content) */}
                    {lang === "jp" && (
                      <span
                        className={`
                          absolute left-1/2 -translate-x-1/2 top-full mt-2
                          px-2 py-1
                          text-[10px] font-mono font-normal tracking-wider uppercase
                          bg-foreground text-background
                          whitespace-nowrap
                          transition-all duration-200
                          pointer-events-none z-50
                          ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}
                        `}
                      >
                        {link.translation}
                        <span className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-foreground rotate-45" />
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Divider between slide links and route links */}
              <div className="w-[2px] h-5 bg-foreground/30 mx-1" />

              {/* Route links (changelog, blog) */}
              {ROUTE_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = isRouteMode && pathname.startsWith(link.href);
                const isHovered = hoveredNav === link.label;
                const displayLabel = lang === "jp" ? link.label : link.translation.toUpperCase();

                return (
                  <TransitionLink
                    key={link.href}
                    href={link.href}
                    onMouseEnter={() => setHoveredNav(link.label)}
                    onMouseLeave={() => setHoveredNav(null)}
                    aria-current={isActive ? "page" : undefined}
                    className={`
                      relative flex items-center gap-2 px-4 py-2
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
                    <span className={lang === "jp" ? "font-jp" : "font-mono"}>{displayLabel}</span>

                    {lang === "jp" && (
                      <span
                        className={`
                          absolute left-1/2 -translate-x-1/2 top-full mt-2
                          px-2 py-1
                          text-[10px] font-mono font-normal tracking-wider uppercase
                          bg-foreground text-background
                          whitespace-nowrap
                          transition-all duration-200
                          pointer-events-none z-50
                          ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}
                        `}
                      >
                        {link.translation}
                        <span className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-foreground rotate-45" />
                      </span>
                    )}
                  </TransitionLink>
                );
              })}
            </div>
          </div>

          {/* Right group - Globe toggle + Lang toggle + Social + CTA */}
          <div className="flex items-center gap-4">
            {/* Globe visibility toggle */}
            <button
              onClick={() => globeState.toggleGlobeVisible()}
              aria-label={globeVisible ? "Hide globe" : "Show globe"}
              className={`p-1.5 border border-foreground/15 transition-all duration-200 ${globeVisible ? "text-accent-primary border-accent-primary/30" : "text-muted hover:text-foreground hover:border-foreground/30"}`}
            >
              <Globe size={14} />
            </button>

            {/* Language toggle */}
            <button
              onClick={() => langState.toggle()}
              className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest border border-foreground/15 text-muted hover:text-foreground hover:border-foreground/30 transition-all duration-200"
            >
              {lang === "jp" ? "EN" : "JP"}
            </button>

            <div className="hidden lg:flex items-center gap-1">
              {SOCIAL_LINKS.map((link) => {
                const Icon = link.icon;
                const isHovered = hoveredSocial === link.label;

                return (
                  <a
                    key={link.label}
                    href={link.href}
                    {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    onMouseEnter={() => setHoveredSocial(link.label)}
                    onMouseLeave={() => setHoveredSocial(null)}
                    className="relative flex items-center justify-center w-10 h-10 text-muted hover:text-foreground hover:bg-foreground/5 transition-all duration-200"
                  >
                    <Icon size={16} />

                    <span
                      className={`
                        absolute left-1/2 -translate-x-1/2 top-full mt-2
                        px-2 py-1
                        text-[10px] font-mono font-normal tracking-wider uppercase
                        bg-foreground text-background
                        whitespace-nowrap
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

            <div className="hidden lg:block w-px h-6 bg-foreground/10" />

            <a
              href="https://linkedin.com/in/muhammad-rafif-tri-risqullah-65311421a"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHoveredCta(true)}
              onMouseLeave={() => setHoveredCta(false)}
              className="relative flex items-center gap-2 bg-accent-primary text-background px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Linkedin size={16} />
              <span className="font-jp">{lang === "jp" ? "繋がりましょう !" : "LET'S CONNECT !"}</span>

              <span
                className={`
                  absolute left-1/2 -translate-x-1/2 top-full mt-3
                  px-3 py-1.5
                  text-[10px] font-mono font-normal tracking-wider uppercase
                  bg-foreground text-background
                  whitespace-nowrap
                  transition-all duration-200
                  pointer-events-none z-50
                  ${hoveredCta ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}
                `}
              >
                {lang === "jp" ? "Let's Connect" : "繋がりましょう"}
                <span className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-foreground rotate-45" />
              </span>
            </a>
          </div>
        </div>
      </nav>

      {/* ─── Mobile top bar (logo + CTA only) ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex md:hidden items-center justify-between transition-all duration-700 ease-out ${loaderVisible ? "opacity-0 blur-sm" : "opacity-100 blur-0"}`}
      >
        {isRouteMode ? (
          <TransitionLink
            href="/"
            translate="no"
            className="text-xl font-black tracking-tight kanji-brutal text-foreground"
          >
            路四
          </TransitionLink>
        ) : (
          <button
            onClick={() => onNavigate?.("hero")}
            translate="no"
            className="text-xl font-black tracking-tight kanji-brutal text-foreground"
          >
            路四
          </button>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => globeState.toggleGlobeVisible()}
            aria-label={globeVisible ? "Hide globe" : "Show globe"}
            className={`p-1.5 border border-foreground/15 transition-colors duration-150 ${globeVisible ? "text-accent-primary" : "text-muted"}`}
          >
            <Globe size={14} />
          </button>

          <button
            onClick={() => langState.toggle()}
            className="px-2.5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest border border-foreground/15 text-muted"
          >
            {lang === "jp" ? "EN" : "JP"}
          </button>

          <a
            href="https://linkedin.com/in/muhammad-rafif-tri-risqullah-65311421a"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-accent-primary text-background px-4 py-2 text-xs font-bold font-jp"
          >
            <Linkedin size={16} />
            {lang === "jp" ? "繋がりましょう !" : "LET'S CONNECT !"}
          </a>
        </div>
      </nav>

      {/* ─── Mobile bottom bar (icon navigation) ─── */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-foreground/8 bg-background/90 backdrop-blur-sm transition-all duration-700 ease-out ${loaderVisible ? "opacity-0 blur-sm" : "opacity-100 blur-0"}`}
        aria-label="Section navigation"
      >
        <div className="flex items-center justify-around px-4 py-2">
          {/* Slide nav items (4) */}
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = !isRouteMode && activeSlide === link.id;
            const mobileLabel = lang === "jp" ? link.label : link.translation.toUpperCase();

            if (isRouteMode) {
              return (
                <TransitionLink
                  key={link.id}
                  href={link.id === "hero" ? "/" : `/#${link.id}`}
                  aria-label={link.translation}
                  className="flex flex-col items-center gap-1 px-3 py-1.5 transition-colors duration-150 text-muted"
                >
                  <Icon size={18} strokeWidth={1.5} />
                  <span className="text-[8px] font-mono uppercase tracking-wider">{mobileLabel}</span>
                </TransitionLink>
              );
            }

            return (
              <button
                key={link.id}
                onClick={() => onNavigate?.(link.id)}
                aria-label={link.translation}
                aria-current={isActive ? "page" : undefined}
                className={`
                  flex flex-col items-center gap-1 px-3 py-1.5
                  transition-colors duration-150
                  ${isActive ? "text-accent-primary" : "text-muted"}
                `}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[8px] font-mono uppercase tracking-wider">{mobileLabel}</span>
              </button>
            );
          })}

          {/* More button */}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              aria-label="More"
              aria-expanded={moreOpen}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 transition-colors duration-150 ${moreOpen ? "text-accent-primary" : "text-muted"}`}
            >
              <MoreHorizontal size={18} strokeWidth={1.5} />
              <span className="text-[8px] font-mono uppercase tracking-wider">
                {lang === "jp" ? "その他" : "MORE"}
              </span>
            </button>

            {/* More popup */}
            {moreOpen && (
              <div className="absolute bottom-full mb-2 right-0 min-w-[160px] z-[60] border border-foreground/10 bg-background/90 backdrop-blur-md py-1">
                {ROUTE_LINKS.map((link) => {
                  const Icon = link.icon;
                  const isActive = isRouteMode && pathname.startsWith(link.href);
                  return (
                    <TransitionLink
                      key={link.href}
                      href={link.href}
                      onClick={closeMore}
                      className={`flex items-center gap-3 px-4 py-2.5 text-xs font-bold tracking-wider transition-colors duration-150 ${isActive ? "text-accent-primary" : "text-muted hover:text-foreground hover:bg-foreground/5"}`}
                    >
                      <Icon size={16} strokeWidth={1.5} />
                      <span className={lang === "jp" ? "font-jp" : "font-mono"}>
                        {lang === "jp" ? link.label : link.translation.toUpperCase()}
                      </span>
                    </TransitionLink>
                  );
                })}

                <div className="h-px bg-foreground/8 my-1" />

                {SOCIAL_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      onClick={closeMore}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold tracking-wider text-muted hover:text-foreground hover:bg-foreground/5 transition-colors duration-150"
                    >
                      <Icon size={16} strokeWidth={1.5} />
                      <span className="font-mono">{link.translation.toUpperCase()}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
