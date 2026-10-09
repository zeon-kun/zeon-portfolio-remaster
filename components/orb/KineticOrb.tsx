"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { audioState, getFrequencyBands } from "@/lib/audio";

// Fibonacci sphere — evenly distributed points, generated once per density.
function spherePoints(count: number): Float32Array {
  const pts = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts[i * 3] = Math.cos(theta) * r;
    pts[i * 3 + 1] = y;
    pts[i * 3 + 2] = Math.sin(theta) * r;
  }
  return pts;
}

const ROTATION_SPEED = 0.18; // radians per second
const TILT_AMOUNT = 0.15;
const WOBBLE = 0.05;
const MAX_DPR = 2;

/**
 * The site's dotted globe, sized by its container. Colour comes from CSS `color`.
 * Reacts to the audio player when it is playing; holds one still frame under reduced motion.
 */
export function KineticOrb({ points = 520, className = "" }: { points?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const pts = spherePoints(points);
    const reduced = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    // Resolved once — reading computed style every frame forces style recalculation.
    const color = getComputedStyle(canvas).color;

    let size = 0;
    let raf = 0;
    let last = 0;
    let time = 0;
    let visible = true;

    function draw() {
      if (!canvas || !ctx || size === 0) return;
      ctx.clearRect(0, 0, size, size);

      const { bass, mid } = audioState.isPlaying ? getFrequencyBands() : { bass: 0, mid: 0 };
      const dot = Math.max(1, (size / 120) * (1 + mid));
      // Leave room for wobble and the bass pulse so nothing clips at the canvas edge.
      const radius = (size / 2 - dot * 2) / (1 + WOBBLE + 0.15);
      const scale = radius * (1 + bass * 0.15);
      const half = size / 2;

      const rotY = time * ROTATION_SPEED;
      const rotX = Math.sin(time * 0.05) * TILT_AMOUNT;
      const cy = Math.cos(rotY);
      const sy = Math.sin(rotY);
      const cx = Math.cos(rotX);
      const sx = Math.sin(rotX);

      ctx.fillStyle = color;
      for (let i = 0; i < points; i++) {
        const wobble = 1 + (reduced ? 0 : WOBBLE * Math.sin(time * 1.2 + i * 0.47) * Math.cos(time * 0.7 + i * 0.31));
        const px = pts[i * 3] * wobble;
        const py = pts[i * 3 + 1] * wobble;
        const pz = pts[i * 3 + 2] * wobble;

        const x1 = px * cy + pz * sy;
        const z1 = -px * sy + pz * cy;
        const y2 = py * cx - z1 * sx;
        const z2 = py * sx + z1 * cx;

        const depth = (z2 + 1.3) / 2.6;
        ctx.globalAlpha = Math.min(0.9, (0.45 + mid * 0.2) * (0.25 + Math.max(0, depth) * 1.75));
        ctx.fillRect(half + x1 * scale - dot / 2, half - y2 * scale - dot / 2, dot, dot);
      }
      ctx.globalAlpha = 1;
    }

    function frame(now: number) {
      // Delta time keeps the speed identical on 60Hz and 120Hz displays.
      time += Math.min(0.05, (now - last) / 1000);
      last = now;
      draw();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (reduced || raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    const resizeObserver = new ResizeObserver(() => {
      size = Math.round(Math.min(canvas.clientWidth, canvas.clientHeight) * dpr);
      canvas.width = size;
      canvas.height = size;
      draw();
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    intersectionObserver.observe(canvas);

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }
    document.addEventListener("visibilitychange", onVisibility);

    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [points]);

  return <canvas ref={canvasRef} className={`block aspect-square text-accent-primary ${className}`} aria-hidden="true" />;
}
