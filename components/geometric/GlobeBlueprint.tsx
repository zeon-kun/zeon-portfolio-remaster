"use client";

import { useRef, useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";

// Generate evenly distributed points on a sphere using fibonacci spiral
function generateSpherePoints(count: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2; // -1 to 1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;

    points.push([
      Math.cos(theta) * radiusAtY,
      y,
      Math.sin(theta) * radiusAtY,
    ]);
  }

  return points;
}

// Generate latitude ring points for wireframe feel
function generateLatitudePoints(
  latCount: number,
  pointsPerRing: number
): [number, number, number][] {
  const points: [number, number, number][] = [];

  for (let lat = 1; lat < latCount; lat++) {
    const phi = (Math.PI * lat) / latCount;
    const y = Math.cos(phi);
    const ringRadius = Math.sin(phi);

    for (let i = 0; i < pointsPerRing; i++) {
      const theta = (2 * Math.PI * i) / pointsPerRing;
      points.push([
        Math.cos(theta) * ringRadius,
        y,
        Math.sin(theta) * ringRadius,
      ]);
    }
  }

  return points;
}

// Generate longitude meridian points
function generateLongitudePoints(
  merCount: number,
  pointsPerMer: number
): [number, number, number][] {
  const points: [number, number, number][] = [];

  for (let mer = 0; mer < merCount; mer++) {
    const theta = (2 * Math.PI * mer) / merCount;

    for (let i = 0; i <= pointsPerMer; i++) {
      const phi = (Math.PI * i) / pointsPerMer;
      const y = Math.cos(phi);
      const ringRadius = Math.sin(phi);
      points.push([
        Math.cos(theta) * ringRadius,
        y,
        Math.sin(theta) * ringRadius,
      ]);
    }
  }

  return points;
}

const SPHERE_POINTS = generateSpherePoints(600);
const LAT_POINTS = generateLatitudePoints(8, 40);
const LON_POINTS = generateLongitudePoints(12, 30);

export function BlueprintElements() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReducedMotion();

    // Handle DPR for crisp pixels
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    let rotation = 0;
    const rotationSpeed = 0.003; // radians per frame

    function rotateY(
      x: number,
      y: number,
      z: number,
      angle: number
    ): [number, number, number] {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [x * cos + z * sin, y, -x * sin + z * cos];
    }

    function draw() {
      if (!canvas || !ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Globe center — right side of viewport, vertically centered
      const cx = w * 0.67;
      const cy = h * 0.5;
      const radius = Math.min(w, h) * 0.22;
      const pixelSize = Math.max(2, Math.round(2 * dpr));

      // Get foreground color from CSS
      const fg = getComputedStyle(canvas).getPropertyValue("color").trim();

      // Draw all point sets
      const allSets: {
        points: [number, number, number][];
        baseOpacity: number;
        size: number;
      }[] = [
        { points: SPHERE_POINTS, baseOpacity: 0.12, size: pixelSize },
        { points: LAT_POINTS, baseOpacity: 0.06, size: Math.max(1, pixelSize - 1) },
        { points: LON_POINTS, baseOpacity: 0.06, size: Math.max(1, pixelSize - 1) },
      ];

      for (const set of allSets) {
        for (const [ox, oy, oz] of set.points) {
          const [rx, ry, rz] = rotateY(ox, oy, oz, rotation);

          // Depth-based opacity: front faces bright, back faces dim
          const depthFactor = (rz + 1) / 2; // 0 (back) to 1 (front)
          const opacity = set.baseOpacity * (0.15 + depthFactor * 0.85);

          // Project to 2D
          const screenX = cx + rx * radius;
          const screenY = cy - ry * radius;

          ctx.fillStyle = fg;
          ctx.globalAlpha = opacity;
          ctx.fillRect(
            Math.round(screenX - set.size / 2),
            Math.round(screenY - set.size / 2),
            set.size,
            set.size
          );
        }
      }

      ctx.globalAlpha = 1;
    }

    function animate() {
      rotation += rotationSpeed;
      draw();
      animRef.current = requestAnimationFrame(animate);
    }

    if (reduced) {
      // Static frame, no rotation
      draw();
    } else {
      animate();
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-[1] pointer-events-none text-foreground"
      aria-hidden="true"
    />
  );
}
