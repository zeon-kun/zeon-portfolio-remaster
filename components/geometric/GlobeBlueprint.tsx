"use client";

import { useRef, useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { getFrequencyBands, audioState } from "@/lib/audio";
import { globeState } from "@/lib/globe-state";

// Generate evenly distributed points on a sphere using fibonacci spiral
function generateSpherePoints(count: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2; // -1 to 1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;

    points.push([Math.cos(theta) * radiusAtY, y, Math.sin(theta) * radiusAtY]);
  }

  return points;
}

// Generate latitude ring points for wireframe feel
function generateLatitudePoints(latCount: number, pointsPerRing: number): [number, number, number][] {
  const points: [number, number, number][] = [];

  for (let lat = 1; lat < latCount; lat++) {
    const phi = (Math.PI * lat) / latCount;
    const y = Math.cos(phi);
    const ringRadius = Math.sin(phi);

    for (let i = 0; i < pointsPerRing; i++) {
      const theta = (2 * Math.PI * i) / pointsPerRing;
      points.push([Math.cos(theta) * ringRadius, y, Math.sin(theta) * ringRadius]);
    }
  }

  return points;
}

// Generate longitude meridian points
function generateLongitudePoints(merCount: number, pointsPerMer: number): [number, number, number][] {
  const points: [number, number, number][] = [];

  for (let mer = 0; mer < merCount; mer++) {
    const theta = (2 * Math.PI * mer) / merCount;

    for (let i = 0; i <= pointsPerMer; i++) {
      const phi = (Math.PI * i) / pointsPerMer;
      const y = Math.cos(phi);
      const ringRadius = Math.sin(phi);
      points.push([Math.cos(theta) * ringRadius, y, Math.sin(theta) * ringRadius]);
    }
  }

  return points;
}

const SPHERE_POINTS = generateSpherePoints(900);
const LOADER_SPHERE_POINTS = generateSpherePoints(200); // separate full-coverage sphere for loading
const LAT_POINTS = generateLatitudePoints(10, 60);
const LON_POINTS = generateLongitudePoints(16, 40);

// Pre-compute which sphere points are "spikes" (every Nth)
const SPIKE_INTERVAL = 15;
const SPIKE_INDICES = new Set(SPHERE_POINTS.map((_, i) => i).filter((i) => i % SPIKE_INTERVAL === 0));

// Easing function for transition (no GSAP dependency)
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// Beat wave: ripple that propagates across the sphere surface
interface BeatWave {
  ox: number;
  oy: number;
  oz: number;
  birthTime: number;
  intensity: number;
}

export function BlueprintElements() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReducedMotion();

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

    // Loading phase rotation speed (slightly faster for visual interest)
    const LOADER_ROTATION_SPEED = 0.008;

    // Wave parameters
    const WAVE_SPEED = 2.5;
    const WAVE_WIDTH = 0.35;
    const WAVE_LIFETIME = 2.0;
    const WAVE_DISPLACEMENT = 0.12;
    const BEAT_THRESHOLD = 0.35;
    const WAVE_COOLDOWN = 0.25;
    const MAX_WAVES = 5;

    const activeWaves: BeatWave[] = [];
    let lastWaveSpawn = 0;
    let prevBass = 0;

    function rotateYAxis(x: number, y: number, z: number, angle: number): [number, number, number] {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [x * cos + z * sin, y, -x * sin + z * cos];
    }

    function rotateXAxis(x: number, y: number, z: number, angle: number): [number, number, number] {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [x, y * cos - z * sin, y * sin + z * cos];
    }

    function angularDist(ax: number, ay: number, az: number, bx: number, by: number, bz: number): number {
      const dot = ax * bx + ay * by + az * bz;
      return Math.acos(Math.min(1, Math.max(-1, dot)));
    }

    function spawnWave(intensity: number) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const wave: BeatWave = {
        ox: Math.sin(phi) * Math.cos(theta),
        oy: Math.cos(phi),
        oz: Math.sin(phi) * Math.sin(theta),
        birthTime: time,
        intensity,
      };
      activeWaves.push(wave);
      if (activeWaves.length > MAX_WAVES) activeWaves.shift();
    }

    function getWaveDisplacement(px: number, py: number, pz: number): number {
      let totalDisp = 0;

      for (let w = activeWaves.length - 1; w >= 0; w--) {
        const wave = activeWaves[w];
        const age = time - wave.birthTime;

        if (age > WAVE_LIFETIME) {
          activeWaves.splice(w, 1);
          continue;
        }

        const wavefrontAngle = age * WAVE_SPEED;
        const dist = angularDist(px, py, pz, wave.ox, wave.oy, wave.oz);
        const distFromFront = Math.abs(dist - wavefrontAngle);

        if (distFromFront < WAVE_WIDTH) {
          const t = distFromFront / WAVE_WIDTH;
          const envelope = Math.exp(-t * t * 3);
          const lifeFade = 1 - age / WAVE_LIFETIME;
          totalDisp += WAVE_DISPLACEMENT * envelope * lifeFade * wave.intensity;
        }
      }

      return totalDisp;
    }

    function draw() {
      if (!canvas || !ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const phase = globeState.phase;

      // Calculate transition progress (0→1)
      let t = 0;
      if (phase === "transitioning") {
        const elapsed = performance.now() - globeState.transitionStart;
        t = Math.min(1, elapsed / globeState.transitionDuration);
      } else if (phase === "ready") {
        t = 1;
      }

      const easedT = phase === "loading" ? 0 : easeOutExpo(t);

      // --- Interpolated parameters ---

      // Center: loading = center of viewport, ready = right side (67%, 50%)
      const loadCx = w * 0.5;
      const loadCy = h * 0.5;
      const readyCx = w * 0.67;
      const readyCy = h * 0.5;
      const cx = loadCx + (readyCx - loadCx) * easedT;
      const cy = loadCy + (readyCy - loadCy) * easedT;

      // Radius: loading = small (120px equivalent), ready = min(w,h) * 0.32
      const loaderRadius = 60 * dpr; // ~120px visual diameter
      const readyBaseRadius = Math.min(w, h) * 0.32;
      const baseRadius = loaderRadius + (readyBaseRadius - loaderRadius) * easedT;

      // Burst effect during transition: points push outward then settle
      const burstFactor = phase === "transitioning" ? (1 - easedT) * 0.3 : 0;

      // Audio reactivity only in ready phase
      const isReady = phase === "ready";
      const { bass, mid, treble } =
        isReady && audioState.isPlaying ? getFrequencyBands() : { bass: 0, mid: 0, treble: 0 };

      // Beat wave spawning only in ready phase
      if (
        isReady &&
        audioState.isPlaying &&
        bass > BEAT_THRESHOLD &&
        prevBass < BEAT_THRESHOLD &&
        time - lastWaveSpawn > WAVE_COOLDOWN
      ) {
        spawnWave(Math.min(bass * 1.5, 1));
        lastWaveSpawn = time;
      }
      prevBass = bass;

      const radiusMultiplier = 1.0 + bass * 0.15 + burstFactor;
      const radius = baseRadius * radiusMultiplier;
      const opacityBoost = mid * 0.13;
      const sizeBoost = treble * 2;
      const basePixelSize = Math.max(3, Math.round(3 * dpr));

      const fg = getComputedStyle(canvas).getPropertyValue("color").trim();

      const hasWaves = activeWaves.length > 0;

      // --- Draw sphere points ---
      // Loading: draw the 200-point loader sphere (full coverage)
      // Transitioning: crossfade loader sphere out, full 900-point sphere in
      // Ready: draw full 900-point sphere only

      const loaderPointSize = Math.max(2, Math.round(2.5 * dpr));

      // Draw loader sphere (loading + fading out during transition)
      if (phase === "loading" || (phase === "transitioning" && easedT < 1)) {
        const loaderOpacityScale = phase === "loading" ? 1 : (1 - easedT);
        for (let idx = 0; idx < LOADER_SPHERE_POINTS.length; idx++) {
          const [bx, by, bz] = LOADER_SPHERE_POINTS[idx];

          const [rx, ry, rz] = rotateYAxis(bx, by, bz, rotationY);

          const depth = (rz + 1) / 2;
          const alpha = 0.15 * (0.2 + depth * 0.8) * loaderOpacityScale;

          const screenX = cx + rx * radius;
          const screenY = cy - ry * radius;

          ctx.fillStyle = fg;
          ctx.globalAlpha = Math.min(alpha, 0.6);
          ctx.fillRect(Math.round(screenX - loaderPointSize / 2), Math.round(screenY - loaderPointSize / 2), loaderPointSize, loaderPointSize);
        }
      }

      // Draw full sphere (fading in during transition, full during ready)
      if (phase !== "loading") {
        const sphereOpacityScale = easedT;

        for (let idx = 0; idx < SPHERE_POINTS.length; idx++) {
          const [bx, by, bz] = SPHERE_POINTS[idx];
          let ox = bx,
            oy = by,
            oz = bz;

          const wobble =
            WOBBLE_AMPLITUDE * easedT * Math.sin(time * WOBBLE_FREQ + idx * 0.47) * Math.cos(time * 0.7 + idx * 0.31);

          const isSpike = SPIKE_INDICES.has(idx);
          const spikeAmount = isSpike ? SPIKE_EXTEND * easedT * (0.8 + 0.2 * Math.sin(time * 0.9 + idx)) : 0;

          const waveDisp = isReady && hasWaves ? getWaveDisplacement(bx, by, bz) : 0;

          const pointRadius = 1 + wobble + spikeAmount + waveDisp;
          ox *= pointRadius;
          oy *= pointRadius;
          oz *= pointRadius;

          let [rx, ry, rz] = rotateYAxis(ox, oy, oz, rotationY);
          [rx, ry, rz] = rotateXAxis(rx, ry, rz, rotationX);

          const depthFactor = (rz + 1.3) / 2.6;
          const waveGlow = waveDisp * 0.8;
          const opacity =
            (0.35 + opacityBoost + waveGlow) * (0.15 + Math.max(0, depthFactor) * 0.85) * sphereOpacityScale;

          const waveSizeBoost = waveDisp * 4;
          const pointSize = basePixelSize + sizeBoost + waveSizeBoost;

          const screenX = cx + rx * radius;
          const screenY = cy - ry * radius;

          ctx.fillStyle = fg;
          ctx.globalAlpha = Math.min(opacity, 0.6);
          ctx.fillRect(Math.round(screenX - pointSize / 2), Math.round(screenY - pointSize / 2), pointSize, pointSize);
        }
      }

      // --- Draw wireframe (lat/lon) — only during transition and ready ---
      if (easedT > 0.01) {
        const wireframeSets: { points: [number, number, number][]; baseOpacity: number; size: number }[] = [
          { points: LAT_POINTS, baseOpacity: 0.18, size: Math.max(2, basePixelSize - 1) },
          { points: LON_POINTS, baseOpacity: 0.18, size: Math.max(2, basePixelSize - 1) },
        ];

        for (const set of wireframeSets) {
          for (let idx = 0; idx < set.points.length; idx++) {
            const [bx, by, bz] = set.points[idx];
            let ox = bx,
              oy = by,
              oz = bz;

            const wobble =
              WOBBLE_AMPLITUDE * easedT * Math.sin(time * WOBBLE_FREQ + idx * 0.47) * Math.cos(time * 0.7 + idx * 0.31);

            const waveDisp = isReady && hasWaves ? getWaveDisplacement(bx, by, bz) : 0;

            const pointRadius = 1 + wobble + waveDisp;
            ox *= pointRadius;
            oy *= pointRadius;
            oz *= pointRadius;

            let [rx, ry, rz] = rotateYAxis(ox, oy, oz, rotationY);
            [rx, ry, rz] = rotateXAxis(rx, ry, rz, rotationX);

            const depthFactor = (rz + 1.3) / 2.6;
            const waveGlow = waveDisp * 0.8;
            const opacity =
              (set.baseOpacity * easedT + opacityBoost + waveGlow) * (0.15 + Math.max(0, depthFactor) * 0.85);

            const waveSizeBoost = waveDisp * 4;
            const pointSize = set.size + waveSizeBoost;

            const screenX = cx + rx * radius;
            const screenY = cy - ry * radius;

            ctx.fillStyle = fg;
            ctx.globalAlpha = Math.min(opacity, 0.6);
            ctx.fillRect(
              Math.round(screenX - pointSize / 2),
              Math.round(screenY - pointSize / 2),
              pointSize,
              pointSize,
            );
          }
        }
      }

      ctx.globalAlpha = 1;
    }

    function animate() {
      const phase = globeState.phase;

      // Rotation speed: loader is faster, ready uses audio-reactive speed
      if (phase === "loading") {
        rotationY += LOADER_ROTATION_SPEED;
        rotationX = 0;
      } else {
        const { bass } = audioState.isPlaying && phase === "ready" ? getFrequencyBands() : { bass: 0 };
        const currentRotSpeed = BASE_ROTATION_SPEED + bass * 0.005;
        rotationY += currentRotSpeed;
        rotationX = Math.sin(time * X_TILT_SPEED) * X_TILT_AMOUNT;
      }

      time += 0.016;
      draw();

      // Check if transition just completed
      if (phase === "transitioning") {
        const elapsed = performance.now() - globeState.transitionStart;
        if (elapsed >= globeState.transitionDuration) {
          globeState.setPhase("ready");
        }
      }

      animRef.current = requestAnimationFrame(animate);
    }

    if (reduced) {
      // Reduced motion: instant jump to final state if transitioning
      if (globeState.phase === "transitioning") {
        globeState.phase = "ready";
      }
      time = 0;
      draw();

      // Poll for phase changes in reduced motion
      const pollInterval = setInterval(() => {
        if (globeState.phase === "transitioning") {
          globeState.setPhase("ready");
        }
        draw();
      }, 100);

      return () => {
        clearInterval(pollInterval);
        window.removeEventListener("resize", resize);
      };
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
      className="fixed inset-0 w-full h-full z-[2] pointer-events-none text-accent-primary"
      aria-hidden="true"
    />
  );
}
