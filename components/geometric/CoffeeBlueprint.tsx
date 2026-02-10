"use client";

import { useRef, useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";

// Generate cylinder body points
function generateCylinderPoints(rings: number, pointsPerRing: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const radius = 40;
  const height = 70;

  for (let r = 0; r < rings; r++) {
    const y = -height / 2 + (r / (rings - 1)) * height;
    for (let i = 0; i < pointsPerRing; i++) {
      const angle = (i / pointsPerRing) * Math.PI * 2;
      points.push([Math.cos(angle) * radius, y, Math.sin(angle) * radius]);
    }
  }
  return points;
}

// Generate cup bottom
function generateCupBottom(points: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const radius = 40;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius * (0.3 + Math.random() * 0.7);
    pts.push([Math.cos(angle) * r, 35, Math.sin(angle) * r]);
  }
  return pts;
}

// Generate handle (torus segment)
function generateHandlePoints(count: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const cx = 55;
  const cy = 0;
  const cz = 0;
  const majorR = 20;
  const minorR = 6;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 1.5 - Math.PI * 0.75;
    for (let j = 0; j < 8; j++) {
      const tubeAngle = (j / 8) * Math.PI * 2;
      points.push([
        cx + Math.cos(angle) * (majorR + Math.cos(tubeAngle) * minorR),
        cy + Math.sin(tubeAngle) * minorR,
        cz + Math.sin(angle) * (majorR + Math.cos(tubeAngle) * minorR),
      ]);
    }
  }
  return points;
}

// Generate steam (rising particles)
function generateSteam(count: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 25;
    points.push([Math.cos(angle) * r, -40 - Math.random() * 30, Math.sin(angle) * r]);
  }
  return points;
}

const CYLINDER_POINTS = generateCylinderPoints(8, 32);
const BOTTOM_POINTS = generateCupBottom(60);
const HANDLE_POINTS = generateHandlePoints(20);
const STEAM_POINTS = generateSteam(40);

export function CoffeeBlueprint() {
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
    const rotSpeed = 0.004;

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

      // Position RIGHT (like globe)
      const cx = w * 0.72;
      const cy = h * 0.5;
      const scale = Math.min(w, h) * 0.0028;
      const fg = getComputedStyle(canvas).getPropertyValue("color").trim();

      const sets: { pts: [number, number, number][]; opacity: number; size: number }[] = [
        { pts: CYLINDER_POINTS, opacity: 0.15, size: 2.5 },
        { pts: BOTTOM_POINTS, opacity: 0.12, size: 2 },
        { pts: HANDLE_POINTS, opacity: 0.14, size: 2.5 },
        { pts: STEAM_POINTS, opacity: 0.08, size: 2 },
      ];

      for (const set of sets) {
        for (const [ox, oy, oz] of set.pts) {
          const [rx, ry, rz] = rotateY(ox, oy, oz, rotation);
          const depth = (rz + 60) / 120;
          const alpha = set.opacity * (0.2 + depth * 0.8);

          const sx = cx + rx * scale;
          const sy = cy - ry * scale;

          ctx.fillStyle = fg;
          ctx.globalAlpha = alpha;
          const sz = Math.max(2 * dpr, set.size * scale * dpr);
          ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
        }
      }

      // Draw rim ellipse
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = fg;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        const [rx, ry] = rotateY(Math.cos(angle) * 40, -35, Math.sin(angle) * 40, rotation);
        const sx = cx + rx * scale;
        const sy = cy - ry * scale;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.stroke();

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
