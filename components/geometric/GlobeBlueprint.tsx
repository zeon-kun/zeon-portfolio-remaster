"use client";

import { useRef, useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { getFrequencyBands, audioState } from "@/lib/audio";

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

// Pre-compute which sphere points are "spikes" (every Nth)
const SPIKE_INTERVAL = 15;
const SPIKE_INDICES = new Set(
  SPHERE_POINTS.map((_, i) => i).filter((i) => i % SPIKE_INTERVAL === 0)
);

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

    let rotationY = 0;
    let rotationX = 0;
    let time = 0;

    const BASE_ROTATION_SPEED = 0.003;
    const WOBBLE_AMPLITUDE = 0.06;
    const WOBBLE_FREQ = 1.2;
    const SPIKE_EXTEND = 0.18;
    const X_TILT_SPEED = 0.0008;
    const X_TILT_AMOUNT = 0.15;

    function rotateYAxis(
      x: number,
      y: number,
      z: number,
      angle: number
    ): [number, number, number] {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [x * cos + z * sin, y, -x * sin + z * cos];
    }

    function rotateXAxis(
      x: number,
      y: number,
      z: number,
      angle: number
    ): [number, number, number] {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [x, y * cos - z * sin, y * sin + z * cos];
    }

    function draw() {
      if (!canvas || !ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Read audio data
      const { bass, mid, treble } = audioState.isPlaying
        ? getFrequencyBands()
        : { bass: 0, mid: 0, treble: 0 };

      // Audio-reactive parameters
      const radiusMultiplier = 1.0 + bass * 0.15;
      const opacityBoost = mid * 0.13;
      const sizeBoost = treble * 2;

      // Globe center — right side of viewport, vertically centered
      const cx = w * 0.67;
      const cy = h * 0.5;
      const baseRadius = Math.min(w, h) * 0.22;
      const radius = baseRadius * radiusMultiplier;
      const basePixelSize = Math.max(2, Math.round(2 * dpr));

      // Get foreground color from CSS
      const fg = getComputedStyle(canvas).getPropertyValue("color").trim();

      // Draw all point sets
      const allSets: {
        points: [number, number, number][];
        baseOpacity: number;
        size: number;
        isSphere: boolean;
      }[] = [
        { points: SPHERE_POINTS, baseOpacity: 0.12, size: basePixelSize, isSphere: true },
        { points: LAT_POINTS, baseOpacity: 0.06, size: Math.max(1, basePixelSize - 1), isSphere: false },
        { points: LON_POINTS, baseOpacity: 0.06, size: Math.max(1, basePixelSize - 1), isSphere: false },
      ];

      for (const set of allSets) {
        for (let idx = 0; idx < set.points.length; idx++) {
          let [ox, oy, oz] = set.points[idx];

          // Virus wobble: per-point noise displacement on radius
          const wobble =
            WOBBLE_AMPLITUDE *
            Math.sin(time * WOBBLE_FREQ + idx * 0.47) *
            Math.cos(time * 0.7 + idx * 0.31);

          // Spiky protrusions on sphere points
          const isSpike = set.isSphere && SPIKE_INDICES.has(idx);
          const spikeAmount = isSpike
            ? SPIKE_EXTEND * (0.8 + 0.2 * Math.sin(time * 0.9 + idx))
            : 0;

          const pointRadius = 1 + wobble + spikeAmount;
          ox *= pointRadius;
          oy *= pointRadius;
          oz *= pointRadius;

          // Rotate on Y axis (primary)
          let [rx, ry, rz] = rotateYAxis(ox, oy, oz, rotationY);
          // Rotate on X axis (slow tilt)
          [rx, ry, rz] = rotateXAxis(rx, ry, rz, rotationX);

          // Depth-based opacity: front faces bright, back faces dim
          const depthFactor = (rz + 1.3) / 2.6; // account for wobble extending past 1
          const opacity =
            (set.baseOpacity + opacityBoost) *
            (0.15 + Math.max(0, depthFactor) * 0.85);

          // Point size with treble boost
          const pointSize = set.size + (set.isSphere ? sizeBoost : 0);

          // Project to 2D
          const screenX = cx + rx * radius;
          const screenY = cy - ry * radius;

          ctx.fillStyle = fg;
          ctx.globalAlpha = Math.min(opacity, 0.3); // clamp max opacity
          ctx.fillRect(
            Math.round(screenX - pointSize / 2),
            Math.round(screenY - pointSize / 2),
            pointSize,
            pointSize
          );
        }
      }

      ctx.globalAlpha = 1;
    }

    function animate() {
      // Read audio for dynamic rotation speed
      const { bass } = audioState.isPlaying
        ? getFrequencyBands()
        : { bass: 0 };
      const currentRotSpeed = BASE_ROTATION_SPEED + bass * 0.005;

      rotationY += currentRotSpeed;
      rotationX = Math.sin(time * X_TILT_SPEED) * X_TILT_AMOUNT;
      time += 0.016; // ~60fps time step
      draw();
      animRef.current = requestAnimationFrame(animate);
    }

    if (reduced) {
      // Static frame, no rotation/wobble
      time = 0;
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
