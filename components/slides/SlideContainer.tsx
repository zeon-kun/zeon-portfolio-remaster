"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/lib/motion";
import { ArchGrid } from "@/components/hero/ArchGrid";
import { MouseTracker } from "@/components/hero/MouseTracker";
import { Navbar } from "@/components/nav/Navbar";
import { HeroSlide } from "./HeroSlide";
import { AboutSlide } from "./AboutSlide";
import { ExperienceSlide } from "./ExperienceSlide";
import { ProjectsSlide } from "./ProjectsSlide";
import { BlueprintElements } from "../geometric/GlobeBlueprint";
import { GestureHint } from "./GestureHint";
import { AudioPlayer } from "../audio/AudioPlayer";
import { useGlobePhase, globeState } from "@/lib/globe-state";
import { useTransitionPhase } from "@/lib/transition";

gsap.registerPlugin(useGSAP);

const SLIDES = ["hero", "about", "experience", "projects"] as const;
export type SlideId = (typeof SLIDES)[number];

export function SlideContainer() {
  const globePhase = useGlobePhase();
  const transitionPhase = useTransitionPhase();
  const isLoaderVisible = globePhase !== "ready" || transitionPhase === "exiting";
  const [activeIndex, setActiveIndex] = useState(0);

  const isTransitioning = useRef(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollPositions = useRef<number[]>(new Array(SLIDES.length).fill(0));
  const containerRef = useRef<HTMLDivElement>(null);
  const lastNavigateTime = useRef(0);
  const boundaryStartTime = useRef(0);
  const boundaryDir = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Always start at hero on page load — clear any stale hash and reset globe target
  useEffect(() => {
    globeState.activeSlide = "hero";
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Listen for popstate (back/forward)
  useEffect(() => {
    function onHashChange() {
      if (isTransitioning.current) return;

      const hash = window.location.hash.replace("#", "") as SlideId;
      const idx = SLIDES.indexOf(hash);

      if (idx >= 0 && idx !== activeIndex) {
        navigateTo(idx);
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [activeIndex]);

  const announceSlide = useCallback((idx: number) => {
    if (liveRegionRef.current) {
      const names = ["Hero", "About", "Experience", "Projects"];
      liveRegionRef.current.textContent = `${names[idx]} section`;
    }
  }, []);

  const navigateTo = useCallback(
    (nextIndex: number) => {
      if (isTransitioning.current || nextIndex === activeIndex || nextIndex < 0 || nextIndex >= SLIDES.length) return;

      setActiveIndex(nextIndex);
      isTransitioning.current = true;
      globeState.setActiveSlide(SLIDES[nextIndex]);

      const direction = nextIndex > activeIndex ? 1 : -1;
      const currentEl = slideRefs.current[activeIndex];
      const nextEl = slideRefs.current[nextIndex];

      if (!currentEl || !nextEl) {
        isTransitioning.current = false;
        return;
      }

      // Save current scroll position before leaving
      if (currentEl.scrollTop > 0) {
        scrollPositions.current[activeIndex] = currentEl.scrollTop;
      }

      // Update hash without triggering hashchange handler
      const newHash = `#${SLIDES[nextIndex]}`;
      window.history.pushState({ slideIndex: nextIndex }, "", nextIndex === 0 ? window.location.pathname : newHash);

      const reduced = prefersReducedMotion();

      if (reduced) {
        const savedScroll = scrollPositions.current[nextIndex];

        gsap.set(currentEl, { opacity: 0, visibility: "hidden" });
        gsap.set(nextEl, {
          x: "0%",
          opacity: 1,
          visibility: "visible",
          scrollTop: 0,
        });

        if (savedScroll > 0) {
          nextEl.scrollTop = savedScroll;
        }

        announceSlide(nextIndex);
        isTransitioning.current = false;
        const heading = nextEl.querySelector("h2, h1");
        if (heading instanceof HTMLElement) heading.focus();
        return;
      }

      // --- Full Animation Path ---
      nextEl.scrollTo({ top: 0, behavior: "instant" });
      gsap.set(nextEl, { clearProps: "all" });

      gsap.set(nextEl, {
        visibility: "visible",
        x: `${direction * 100}%`,
        opacity: 0,
      });

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(currentEl, { visibility: "hidden" });

          const savedScroll = scrollPositions.current[nextIndex];
          if (savedScroll > 0) {
            nextEl.scrollTop = savedScroll;
          }

          announceSlide(nextIndex);
          isTransitioning.current = false;

          const heading = nextEl.querySelector("h2, h1");
          if (heading instanceof HTMLElement) heading.focus();
        },
      });

      tl.to(currentEl, {
        x: `${direction * -100}%`,
        opacity: 0,
        duration: 0.6,
        ease: "expo.inOut",
      });

      tl.fromTo(
        nextEl,
        { x: `${direction * 100}%`, opacity: 0 },
        { x: "0%", opacity: 1, duration: 0.6, ease: "expo.inOut" },
        "-=0.3"
      );
    },
    [activeIndex, announceSlide]
  );

  const handleNavigate = useCallback(
    (id: SlideId) => {
      const idx = SLIDES.indexOf(id);
      if (idx >= 0) navigateTo(idx);
    },
    [navigateTo]
  );

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("[role='dialog']") || target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          navigateTo(activeIndex + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          navigateTo(activeIndex - 1);
          break;
        case "Home":
          e.preventDefault();
          navigateTo(0);
          break;
        case "End":
          e.preventDefault();
          navigateTo(SLIDES.length - 1);
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, navigateTo]);

  // Wheel navigation — dwell-at-boundary pattern
  useEffect(() => {
    const DWELL_MS = 1000;
    const COOLDOWN = 1000;
    const IDLE_RESET = 300;

    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    function onWheel(e: WheelEvent) {
      const currentEl = slideRefs.current[activeIndex];
      if (!currentEl) return;

      const now = Date.now();
      if (now - lastNavigateTime.current < COOLDOWN) return;

      const atTop = currentEl.scrollTop <= 0;
      const atBottom = currentEl.scrollTop + currentEl.clientHeight >= currentEl.scrollHeight - 10;
      const dir = e.deltaY > 0 ? 1 : -1;
      const atBoundary = (dir === 1 && atBottom) || (dir === -1 && atTop);

      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        boundaryStartTime.current = 0;
        boundaryDir.current = 0;
      }, IDLE_RESET);

      if (!atBoundary || dir !== boundaryDir.current) {
        boundaryStartTime.current = 0;
        boundaryDir.current = dir;
        return;
      }

      if (boundaryStartTime.current === 0) {
        boundaryStartTime.current = now;
        boundaryDir.current = dir;
        return;
      }

      if (now - boundaryStartTime.current >= DWELL_MS) {
        boundaryStartTime.current = 0;
        boundaryDir.current = 0;
        lastNavigateTime.current = now;
        navigateTo(activeIndex + dir);
      }
    }

    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [activeIndex, navigateTo]);

  // Touch swipe navigation
  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }

    function onTouchEnd(e: TouchEvent) {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;
      touchStartRef.current = null;

      if (Math.abs(dx) < Math.abs(dy) * 2 || Math.abs(dx) < 50 || dt > 300) return;

      if (dx < 0) navigateTo(activeIndex + 1);
      else navigateTo(activeIndex - 1);
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [activeIndex, navigateTo]);

  // Set initial slide positions on mount — always hero (index 0)
  useGSAP(
    () => {
      slideRefs.current.forEach((el, i) => {
        if (!el) return;
        if (i === 0) {
          gsap.set(el, { x: "0%", opacity: 1, visibility: "visible" });
        } else {
          gsap.set(el, { x: "100%", opacity: 0, visibility: "hidden" });
        }
      });
    },
    { scope: containerRef }
  );

  const setSlideRef = useCallback(
    (idx: number) => (el: HTMLDivElement | null) => {
      slideRefs.current[idx] = el;
    },
    []
  );

  return (
    <>
      <ArchGrid />
      <MouseTracker />
      <BlueprintElements />
      <Navbar activeSlide={SLIDES[activeIndex]} onNavigate={handleNavigate} loaderVisible={isLoaderVisible} />
      <AudioPlayer loaderVisible={isLoaderVisible} />
      <GestureHint />

      <div ref={liveRegionRef} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />

      <div ref={containerRef} id="main" className={`relative z-10 w-full h-screen contain-paint overflow-hidden transition-all duration-500 ease-out ${isLoaderVisible ? "opacity-0 blur-sm" : "opacity-100 blur-0"}`}>
        <div
          ref={setSlideRef(0)}
          role="region"
          aria-label="Hero"
          className="absolute inset-0 w-full h-full overflow-hidden"
        >
          <HeroSlide isActive={activeIndex === 0} />
        </div>

        <div
          ref={setSlideRef(1)}
          role="region"
          aria-label="About"
          className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden"
        >
          <AboutSlide isActive={activeIndex === 1} />
        </div>

        <div
          ref={setSlideRef(2)}
          role="region"
          aria-label="Experience"
          className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden"
        >
          <ExperienceSlide isActive={activeIndex === 2} />
        </div>

        <div
          ref={setSlideRef(3)}
          role="region"
          aria-label="Projects"
          className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden"
        >
          <ProjectsSlide isActive={activeIndex === 3} />
        </div>
      </div>
    </>
  );
}
