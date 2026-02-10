"use client";

import { useRef, useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";

// Generate cube wireframe
function generateCubePoints(edgePoints: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const size = 50;

  // 12 edges
  const edges = [
    // Bottom face
    [
      [-size, -size, -size],
      [size, -size, -size],
    ],
    [
      [size, -size, -size],
      [size, size, -size],
    ],
    [
      [size, size, -size],
      [-size, size, -size],
    ],
    [
      [-size, size, -size],
      [-size, -size, -size],
    ],
    // Top face
    [
      [-size, -size, size],
      [size, -size, size],
    ],
    [
      [size, -size, size],
      [size, size, size],
    ],
    [
      [size, size, size],
      [-size, size, size],
    ],
    [
      [-size, size, size],
      [-size, -size, size],
    ],
    // Vertical edges
    [
      [-size, -size, -size],
      [-size, -size, size],
    ],
    [
      [size, -size, -size],
      [size, -size, size],
    ],
    [
      [size, size, -size],
      [size, size, size],
    ],
    [
      [-size, size, -size],
      [-size, size, size],
    ],
  ];

  for (const [start, end] of edges) {
    for (let i = 0; i < edgePoints; i++) {
      const t = i / (edgePoints - 1);
      points.push([
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
        start[2] + (end[2] - start[2]) * t,
      ]);
    }
  }
  return points;
}

// Generate internal data flow lines
function generateInternalLines(count: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const size = 45;

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * size * 2;
    const z = (Math.random() - 0.5) * size * 2;
    // Vertical lines inside cube
    for (let y = -size; y <= size; y += 4) {
      points.push([x, y, z]);
    }
  }
  return points;
}

// Generate floating brackets around cube
function generateFloatingBrackets(count: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const radius = 90;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const y = (Math.random() - 0.5) * 100;
    const r = radius + (Math.random() - 0.5) * 30;

    // Simple bracket shape points
    const cx = Math.cos(angle) * r;
    const cz = Math.sin(angle) * r;

    // Draw bracket as small cluster
    points.push([cx - 5, y, cz]);
    points.push([cx + 5, y, cz]);
    points.push([cx - 5, y - 8, cz]);
    points.push([cx + 5, y - 8, cz]);
    points.push([cx - 5, y + 8, cz]);
    points.push([cx + 5, y + 8, cz]);
  }
  return points;
}

const CUBE_POINTS = generateCubePoints(15);
const INTERNAL_POINTS = generateInternalLines(8);
const BRACKET_POINTS = generateFloatingBrackets(12);

export function CodeBlueprint() {
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

    function rotateX(x: number, y: number, z: number, angle: number): [number, number, number] {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [x, y * cos - z * sin, y * sin + z * cos];
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
        rotateX?: boolean;
      }[] = [
        { pts: CUBE_POINTS, opacity: 0.18, size: 3 },
        { pts: INTERNAL_POINTS, opacity: 0.1, size: 2 },
        { pts: BRACKET_POINTS, opacity: 0.12, size: 2.5 },
      ];

      for (const set of sets) {
        for (const [ox, oy, oz] of set.pts) {
          let [rx, ry, rz] = rotateY(ox, oy, oz, rotation);
          if (set.rotateX) {
            [rx, ry, rz] = rotateX(rx, ry, rz, rotation * 0.5);
          }

          const depth = (rz + 100) / 200;
          const alpha = set.opacity * (0.3 + depth * 0.7);

          const sx = cx + rx * scale;
          const sy = cy - ry * scale;

          ctx.fillStyle = fg;
          ctx.globalAlpha = alpha;
          const sz = Math.max(2 * dpr, set.size * scale * dpr);
          ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
        }
      }

      // Draw face outlines for cube
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = fg;
      ctx.lineWidth = 1 * dpr;

      const faces = [
        [
          [-50, -50, -50],
          [50, -50, -50],
          [50, 50, -50],
          [-50, 50, -50],
        ], // back
        [
          [-50, -50, 50],
          [50, -50, 50],
          [50, 50, 50],
          [-50, 50, 50],
        ], // front
      ];

      for (const face of faces) {
        ctx.beginPath();
        for (let i = 0; i <= 4; i++) {
          const [ox, oy, oz] = face[i % 4];
          const [rx, ry] = rotateY(ox, oy, oz, rotation);
          const sx = cx + rx * scale;
          const sy = cy - ry * scale;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }

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
