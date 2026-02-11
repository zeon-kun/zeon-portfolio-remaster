"use client";

import { useRef, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(useGSAP);

export function MouseTracker() {
  const vLineRef = useRef<HTMLDivElement>(null);
  const hLineRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLSpanElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const dotTopRef = useRef<HTMLDivElement>(null);
  const dotBottomRef = useRef<HTMLDivElement>(null);
  const dotLeftRef = useRef<HTMLDivElement>(null);
  const dotRightRef = useRef<HTMLDivElement>(null);
  const hasEnteredRef = useRef(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!hasEnteredRef.current) {
      hasEnteredRef.current = true;
      gsap.to("[data-mouse-element]", {
        opacity: 1,
        duration: 0.4,
      });
    }

    const tweenOpts = { duration: 0.8, ease: "power2.out" };

    // Full-height vertical line follows cursor X
    if (vLineRef.current) {
      gsap.to(vLineRef.current, { x: e.clientX, ...tweenOpts });
    }

    // Full-width horizontal line follows cursor Y
    if (hLineRef.current) {
      gsap.to(hLineRef.current, { y: e.clientY, ...tweenOpts });
    }

    // Small + marker at intersection
    if (markerRef.current) {
      gsap.to(markerRef.current, { x: e.clientX, y: e.clientY, duration: 0.6, ease: "power2.out" });
    }

    // Edge dots — follow cursor axis along viewport borders
    if (dotTopRef.current) {
      gsap.to(dotTopRef.current, { x: e.clientX, ...tweenOpts });
    }
    if (dotBottomRef.current) {
      gsap.to(dotBottomRef.current, { x: e.clientX, ...tweenOpts });
    }
    if (dotLeftRef.current) {
      gsap.to(dotLeftRef.current, { y: e.clientY, ...tweenOpts });
    }
    if (dotRightRef.current) {
      gsap.to(dotRightRef.current, { y: e.clientY, ...tweenOpts });
    }

    // Coordinate readout
    if (coordsRef.current) {
      const normX = ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3);
      const normY = (-(e.clientY / window.innerHeight) * 2 + 1).toFixed(3);
      coordsRef.current.textContent = `x ${normX}  y ${normY}`;
    }
  }, []);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <>
      {/* Vertical line — full viewport height, follows cursor X */}
      <div
        ref={vLineRef}
        data-mouse-element
        className="fixed top-0 left-0 w-px h-screen bg-foreground/6 z-30 pointer-events-none opacity-0"
      />

      {/* Horizontal line — full viewport width, follows cursor Y */}
      <div
        ref={hLineRef}
        data-mouse-element
        className="fixed top-0 left-0 w-screen h-px bg-foreground/6 z-30 pointer-events-none opacity-0"
      />

      {/* Edge dots — small squares at viewport borders */}
      {/* Top edge dot (follows X) */}
      <div
        ref={dotTopRef}
        data-mouse-element
        className="fixed top-0 left-0 -translate-x-1/2 z-30 pointer-events-none opacity-0"
      >
        <span className="block w-2 h-2 bg-foreground/30" />
      </div>

      {/* Bottom edge dot (follows X) */}
      <div
        ref={dotBottomRef}
        data-mouse-element
        className="fixed bottom-0 left-0 -translate-x-1/2 z-30 pointer-events-none opacity-0"
      >
        <span className="block w-2 h-2 bg-foreground/30" />
      </div>

      {/* Left edge dot (follows Y) */}
      <div
        ref={dotLeftRef}
        data-mouse-element
        className="fixed top-0 left-0 -translate-y-1/2 z-30 pointer-events-none opacity-0"
      >
        <span className="block w-2 h-2 bg-foreground/30" />
      </div>

      {/* Right edge dot (follows Y) */}
      <div
        ref={dotRightRef}
        data-mouse-element
        className="fixed top-0 right-0 -translate-y-1/2 z-30 pointer-events-none opacity-0"
      >
        <span className="block w-2 h-2 bg-foreground/30" />
      </div>

      {/* Intersection marker + coordinate label */}
      <div ref={markerRef} data-mouse-element className="fixed top-0 left-0 z-40 pointer-events-none opacity-0">
        {/* + marker */}
        <span className="absolute -translate-x-1/2 -translate-y-1/2 text-[10px] text-foreground/20 font-mono select-none">
          +
        </span>
        {/* Coordinate readout */}
        <span
          ref={coordsRef}
          className="absolute left-3 top-1 text-[9px] font-mono text-foreground/25 whitespace-nowrap select-none tracking-wide"
        >
          x 0.000 y 0.000
        </span>
      </div>
    </>
  );
}
