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

gsap.registerPlugin(useGSAP);

const SLIDES = ["hero", "about", "experience", "projects"] as const;
export type SlideId = (typeof SLIDES)[number];

export function SlideContainer() {
  // 1. INSTANT STATE SYNC: State updates immediately when navigation is triggered.
  const [activeIndex, setActiveIndex] = useState(0);

  const isTransitioning = useRef(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollPositions = useRef<number[]>(new Array(SLIDES.length).fill(0));
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Read hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as SlideId;
    const idx = SLIDES.indexOf(hash);
    if (idx > 0) {
      setActiveIndex(idx);
      // Set initial positions without animation
      slideRefs.current.forEach((el, i) => {
        if (!el) return;
        if (i === idx) {
          gsap.set(el, { x: "0%", opacity: 1, visibility: "visible" });
        } else {
          gsap.set(el, {
            x: i < idx ? "-100%" : "100%",
            opacity: 0,
            visibility: "hidden",
          });
        }
      });
    }
  }, []);

  // Listen for popstate (back/forward)
  // 2. EXECUTION GUARD: Strictly prevents redundant triggers during animation.
  useEffect(() => {
    function onHashChange() {
      // GUARD: If we are currently animating, ignore the hash change event entirely.
      // This prevents the "Double Flash".
      if (isTransitioning.current) return;

      const hash = window.location.hash.replace("#", "") as SlideId;
      const idx = SLIDES.indexOf(hash);

      // Only navigate if it's a valid index and different from current
      if (idx >= 0 && idx !== activeIndex) {
        navigateTo(idx);
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
    // We include activeIndex here so the comparison `idx !== activeIndex` is accurate,
    // though navigateTo uses its own internal check.
  }, [activeIndex]);

  const announceSlide = useCallback((idx: number) => {
    if (liveRegionRef.current) {
      const names = ["Hero", "About", "Experience", "Projects"];
      liveRegionRef.current.textContent = `${names[idx]} section`;
    }
  }, []);

  const navigateTo = useCallback(
    (nextIndex: number) => {
      // Initial guards
      if (isTransitioning.current || nextIndex === activeIndex || nextIndex < 0 || nextIndex >= SLIDES.length) return;

      // INSTANT STATE SYNC: Update React state immediately so Navbar updates NOW.
      setActiveIndex(nextIndex);
      isTransitioning.current = true;

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
        // Reduced motion path
        const savedScroll = scrollPositions.current[nextIndex];

        gsap.set(currentEl, { opacity: 0, visibility: "hidden" });

        // 3. SCROLL RESET & RESTORE: Ensure we start at top, then restore if needed.
        // This prevents the "Viewport Spill" even in reduced motion mode.
        gsap.set(nextEl, {
          x: "0%",
          opacity: 1,
          visibility: "visible",
          scrollTop: 0, // Force reset
        });

        // Restore scroll position after visibility change
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

      // 3. SCROLL RESET: Explicitly reset scroll to top BEFORE animation starts.
      // This is crucial to prevent the "Tall Content Viewport Spill".
      nextEl.scrollTo({ top: 0, behavior: "instant" });

      // Clear any lingering GSAP props to ensure clean state
      gsap.set(nextEl, { clearProps: "all" });

      // Prepare next slide off-screen
      gsap.set(nextEl, {
        visibility: "visible",
        x: `${direction * 100}%`,
        opacity: 0,
      });

      // Create timeline
      const tl = gsap.timeline({
        onComplete: () => {
          // Hide old slide
          gsap.set(currentEl, { visibility: "hidden" });

          // 3. SCROLL RESTORE: After animation completes, restore previous scroll position.
          // We do this AFTER so the user doesn't see the "jump" during the slide-in.
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

      // Animate current slide out
      tl.to(currentEl, {
        x: `${direction * -100}%`,
        opacity: 0,
        duration: 0.6,
        ease: "expo.inOut",
      });

      // Animate next slide in
      tl.fromTo(
        nextEl,
        { x: `${direction * 100}%`, opacity: 0 },
        { x: "0%", opacity: 1, duration: 0.6, ease: "expo.inOut" },
        "-=0.3" // Overlap
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

  // Wheel navigation (debounced)
  useEffect(() => {
    function onWheel(e: WheelEvent) {
      const currentEl = slideRefs.current[activeIndex];
      if (!currentEl) return;

      const now = Date.now();
      if (now - lastWheelTime.current < 800) return;

      // Check if we're at scroll boundaries
      const atTop = currentEl.scrollTop <= 0;
      const atBottom = currentEl.scrollTop + currentEl.clientHeight >= currentEl.scrollHeight - 10;

      if (e.deltaY > 0 && atBottom) {
        lastWheelTime.current = now;
        navigateTo(activeIndex + 1);
      } else if (e.deltaY < 0 && atTop) {
        lastWheelTime.current = now;
        navigateTo(activeIndex - 1);
      }
    }
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
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

      // Only handle horizontal swipes
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

  // Set initial slide positions on mount
  useGSAP(
    () => {
      const hash = window.location.hash.replace("#", "") as SlideId;
      const initialIdx = SLIDES.indexOf(hash) >= 0 ? SLIDES.indexOf(hash) : 0;

      if (initialIdx !== activeIndex) {
        setActiveIndex(initialIdx);
      }

      slideRefs.current.forEach((el, i) => {
        if (!el) return;
        if (i === initialIdx) {
          gsap.set(el, { x: "0%", opacity: 1, visibility: "visible" });
        } else {
          gsap.set(el, {
            x: i < initialIdx ? "-100%" : "100%",
            opacity: 0,
            visibility: "hidden",
          });
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
      <Navbar activeSlide={SLIDES[activeIndex]} onNavigate={handleNavigate} />

      <div ref={liveRegionRef} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* 
        4. RENDERING CONTAINMENT: 
        Added 'contain: paint' to create a new paint layer, 
        preventing tall children from affecting layout during transitions.
        Also ensures overflow is strictly clipped.
      */}
      <div ref={containerRef} id="main" className="relative w-full h-screen contain-paint overflow-hidden">
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
