"use client";

import { useRef, useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const TIPS = [
  "Did you know? This portfolio is built with Next.js and GSAP",
  "Did you know? The globe uses 600+ calculated points",
  "Did you know? Press arrow keys to navigate slides",
  "Did you know? Reduced motion is fully supported",
  "Did you know? The kanji 路四 represents my name",
];

// Generate mini sphere points
function generateMiniSphere(count: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push([Math.cos(theta) * radiusAtY, y, Math.sin(theta) * radiusAtY]);
  }
  return points;
}

const SPHERE_POINTS = generateMiniSphere(200);

export function PageLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);

  // 1. Initialize with a static tip to prevent hydration mismatch
  const [tip, setTip] = useState(TIPS[0]);

  // 2. Randomize tip ONLY on mount (Client-side)
  useEffect(() => {
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    setTip(randomTip);

    const loadTimer = setTimeout(() => {
      setFading(true);
      setTimeout(() => setLoading(false), 500);
    }, 1800);

    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (!loading || fading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const dpr = window.devicePixelRatio || 1;
    let isMounted = true;

    canvas.width = 120 * dpr;
    canvas.height = 120 * dpr;
    canvas.style.width = "120px";
    canvas.style.height = "120px";

    let rotation = 0;
    const rotSpeed = 0.008;

    function rotateY(x: number, y: number, z: number, angle: number): [number, number, number] {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [x * cos + z * sin, y, -x * sin + z * cos];
    }

    function draw() {
      if (!ctx || !canvas || !isMounted) return;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = w * 0.35;
      const fg = getComputedStyle(canvas).getPropertyValue("color").trim() || "#000000";

      ctx.clearRect(0, 0, w, h);

      for (const [ox, oy, oz] of SPHERE_POINTS) {
        const [rx, ry, rz] = rotateY(ox, oy, oz, rotation);
        const depth = (rz + 1) / 2;
        const alpha = 0.15 * (0.2 + depth * 0.8);

        const sx = cx + rx * radius;
        const sy = cy - ry * radius;

        ctx.fillStyle = fg;
        ctx.globalAlpha = alpha;
        const size = Math.max(2 * dpr, 2.5 * dpr);
        ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
      }
    }

    function animate() {
      if (!isMounted) return;
      rotation += rotSpeed;
      draw();
      animRef.current = requestAnimationFrame(animate);
    }

    reduced ? draw() : animate();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [loading, fading]);

  if (!loading) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[9999] bg-background 
        flex flex-col items-center justify-center gap-8
        transition-all duration-500 ease-out
        ${fading ? "opacity-0 invisible" : "opacity-100 visible"}
      `}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className={`
          text-foreground transition-transform duration-500
          ${fading ? "scale-90" : "scale-100"}
        `}
      />

      <div className="flex flex-col items-center gap-3">
        <span className="text-xs font-mono text-muted tracking-[0.3em] uppercase animate-pulse">Loading</span>

        <div className="w-24 h-px bg-foreground/10 overflow-hidden">
          <div
            className={`
              h-full bg-foreground/40 
              transition-all duration-[1800ms] ease-out
              ${fading ? "w-full" : "w-0"}
            `}
          />
        </div>
      </div>

      <p
        className={`
          absolute bottom-32 text-center text-[10px] font-mono text-muted/60 max-w-xs leading-relaxed px-8
          transition-all duration-300
          ${fading ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}
        `}
      >
        {tip}
      </p>
    </div>
  );
}
