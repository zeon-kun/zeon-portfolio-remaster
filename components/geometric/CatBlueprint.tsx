"use client";

import { useRef, useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";

// Generate sphere for head
function generateSpherePoints(count: number, radius: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = ((i / (count - 1)) * 2 - 1) * radius;
    const r = Math.sqrt(radius * radius - y * y);
    const theta = goldenAngle * i;
    points.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
  }
  return points;
}

// Generate triangular ears
function generateEarPoints(count: number): [number, number, number][] {
  const points: [number, number, number][] = [];

  // Left ear
  const leftEar = { x: -35, y: -50, z: 0 };
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const u = Math.random() * (1 - t);
    // Triangle: base to tip
    const baseX = -20 + Math.random() * 20;
    const baseY = -30;
    const tipX = -35;
    const tipY = -70;
    const z = (Math.random() - 0.5) * 15;

    points.push([baseX + (tipX - baseX) * t, baseY + (tipY - baseY) * t, z]);
  }

  // Right ear
  for (let i = 0; i < count; i++) {
    const baseX = 20 - Math.random() * 20;
    const baseY = -30;
    const tipX = 35;
    const tipY = -70;
    const z = (Math.random() - 0.5) * 15;
    const t = Math.random();

    points.push([baseX + (tipX - baseX) * t, baseY + (tipY - baseY) * t, z]);
  }
  return points;
}

// Generate whiskers (lines from face)
function generateWhiskerPoints(): [number, number, number][] {
  const points: [number, number, number][] = [];

  // Left whiskers
  for (let i = 0; i < 3; i++) {
    const y = 10 + i * 15;
    for (let t = 0; t <= 10; t++) {
      points.push([-45 - t * 6, y, (Math.random() - 0.5) * 5]);
    }
  }

  // Right whiskers
  for (let i = 0; i < 3; i++) {
    const y = 10 + i * 15;
    for (let t = 0; t <= 10; t++) {
      points.push([45 + t * 6, y, (Math.random() - 0.5) * 5]);
    }
  }
  return points;
}

// Generate eyes (rings)
function generateEyePoints(cx: number, cy: number, cz: number, radius: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 0.6, cz]);
  }
  return points;
}

const HEAD_POINTS = generateSpherePoints(400, 45);
const EAR_POINTS = generateEarPoints(150);
const WHISKER_POINTS = generateWhiskerPoints();
const LEFT_EYE = generateEyePoints(-18, -5, 38, 8);
const RIGHT_EYE = generateEyePoints(18, -5, 38, 8);

export function CatBlueprint() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const dpr = window.devicePixelRatio || 1;

    let isMounted = true;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    let rotation = 0;
    const rotSpeed = 0.003;

    function rotateY(x: number, y: number, z: number, angle: number): [number, number, number] {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [x * cos + z * sin, y, -x * sin + z * cos];
    }

    function draw() {
      if (!ctx || !canvas || !isMounted) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.72;
      const cy = h * 0.5;
      const scale = Math.min(w, h) * 0.0028;
      const fg = getComputedStyle(canvas).getPropertyValue("color").trim();

      const sets: {
        pts: [number, number, number][];
        opacity: number;
        size: number;
      }[] = [
        { pts: HEAD_POINTS, opacity: 0.13, size: 2.5 },
        { pts: EAR_POINTS, opacity: 0.16, size: 2.5 },
        { pts: WHISKER_POINTS, opacity: 0.1, size: 2 },
        { pts: LEFT_EYE, opacity: 0.25, size: 3 },
        { pts: RIGHT_EYE, opacity: 0.25, size: 3 },
      ];

      for (const set of sets) {
        for (const [ox, oy, oz] of set.pts) {
          const [rx, ry, rz] = rotateY(ox, oy, oz, rotation);
          const depth = (rz + 50) / 100;
          const alpha = set.opacity * (0.2 + depth * 0.8);

          const sx = cx + rx * scale;
          const sy = cy - ry * scale;

          ctx.fillStyle = fg;
          ctx.globalAlpha = alpha;
          const sz = Math.max(2 * dpr, set.size * scale * dpr);
          ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
        }
      }

      // Draw nose
      const noseY = 20;
      const noseZ = 42;
      const [nrx, nry] = rotateY(0, noseY, noseZ, rotation);
      ctx.globalAlpha = 0.3;
      ctx.fillRect(cx + nrx * scale - 3 * dpr, cy - nry * scale - 2 * dpr, 6 * dpr, 4 * dpr);

      ctx.globalAlpha = 1;
    }

    function animate() {
      if (!isMounted) return;

      rotation += rotSpeed;
      draw();
      animRef.current = requestAnimationFrame(animate);
    }

    reduced ? draw() : animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none text-foreground"
      aria-hidden="true"
    />
  );
}
