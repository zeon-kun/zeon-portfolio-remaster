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
const LAT_POINTS = generateLatitudePoints(10, 60);
const LON_POINTS = generateLongitudePoints(16, 40);

// Pre-compute which sphere points are "spikes" (every Nth)
const SPIKE_INTERVAL = 15;
const SPIKE_INDICES = new Set(SPHERE_POINTS.map((_, i) => i).filter((i) => i % SPIKE_INTERVAL === 0));

// Beat wave: ripple that propagates across the sphere surface
interface BeatWave {
  // Origin point on unit sphere (normalized)
  ox: number;
  oy: number;
  oz: number;
  birthTime: number;
  intensity: number; // 0–1, based on beat strength
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

    // Wave parameters
    const WAVE_SPEED = 2.5; // radians per second across surface
    const WAVE_WIDTH = 0.35; // angular width of wavefront
    const WAVE_LIFETIME = 2.0; // seconds until wave fades completely
    const WAVE_DISPLACEMENT = 0.12; // max radial push
    const BEAT_THRESHOLD = 0.35; // bass level to trigger a wave
    const WAVE_COOLDOWN = 0.25; // min seconds between wave spawns
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

    // Angular distance between two points on unit sphere (dot product → acos)
    function angularDist(ax: number, ay: number, az: number, bx: number, by: number, bz: number): number {
      const dot = ax * bx + ay * by + az * bz;
      return Math.acos(Math.min(1, Math.max(-1, dot)));
    }

    // Spawn a wave from a random point on the sphere
    function spawnWave(intensity: number) {
      // Random point on unit sphere
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

    // Calculate wave displacement for a point given all active waves
    function getWaveDisplacement(px: number, py: number, pz: number): number {
      let totalDisp = 0;

      for (let w = activeWaves.length - 1; w >= 0; w--) {
        const wave = activeWaves[w];
        const age = time - wave.birthTime;

        if (age > WAVE_LIFETIME) {
          activeWaves.splice(w, 1);
          continue;
        }

        // Wavefront angular radius expands over time
        const wavefrontAngle = age * WAVE_SPEED;
        const dist = angularDist(px, py, pz, wave.ox, wave.oy, wave.oz);

        // How close is this point to the wavefront edge?
        const distFromFront = Math.abs(dist - wavefrontAngle);

        if (distFromFront < WAVE_WIDTH) {
          // Gaussian-ish falloff from wavefront center
          const t = distFromFront / WAVE_WIDTH;
          const envelope = Math.exp(-t * t * 3);
          // Fade out over lifetime
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

      // Read audio data
      const { bass, mid, treble } = audioState.isPlaying ? getFrequencyBands() : { bass: 0, mid: 0, treble: 0 };

      // Detect beat onset: bass rising above threshold
      if (
        audioState.isPlaying &&
        bass > BEAT_THRESHOLD &&
        prevBass < BEAT_THRESHOLD &&
        time - lastWaveSpawn > WAVE_COOLDOWN
      ) {
        spawnWave(Math.min(bass * 1.5, 1));
        lastWaveSpawn = time;
      }
      prevBass = bass;

      // Audio-reactive parameters
      const radiusMultiplier = 1.0 + bass * 0.15;
      const opacityBoost = mid * 0.13;
      const sizeBoost = treble * 2;

      // Globe center — right side of viewport, vertically centered
      const cx = w * 0.67;
      const cy = h * 0.5;
      const baseRadius = Math.min(w, h) * 0.32;
      const radius = baseRadius * radiusMultiplier;
      const basePixelSize = Math.max(3, Math.round(3 * dpr));

      // Get foreground color from CSS
      const fg = getComputedStyle(canvas).getPropertyValue("color").trim();

      // Draw all point sets
      const allSets: {
        points: [number, number, number][];
        baseOpacity: number;
        size: number;
        isSphere: boolean;
      }[] = [
        { points: SPHERE_POINTS, baseOpacity: 0.35, size: basePixelSize, isSphere: true },
        { points: LAT_POINTS, baseOpacity: 0.18, size: Math.max(2, basePixelSize - 1), isSphere: false },
        { points: LON_POINTS, baseOpacity: 0.18, size: Math.max(2, basePixelSize - 1), isSphere: false },
      ];

      const hasWaves = activeWaves.length > 0;

      for (const set of allSets) {
        for (let idx = 0; idx < set.points.length; idx++) {
          const [bx, by, bz] = set.points[idx];
          let ox = bx,
            oy = by,
            oz = bz;

          // Virus wobble: per-point noise displacement on radius
          const wobble =
            WOBBLE_AMPLITUDE * Math.sin(time * WOBBLE_FREQ + idx * 0.47) * Math.cos(time * 0.7 + idx * 0.31);

          // Spiky protrusions on sphere points
          const isSpike = set.isSphere && SPIKE_INDICES.has(idx);
          const spikeAmount = isSpike ? SPIKE_EXTEND * (0.8 + 0.2 * Math.sin(time * 0.9 + idx)) : 0;

          // Beat wave displacement — pushes points outward along their normal
          const waveDisp = hasWaves ? getWaveDisplacement(bx, by, bz) : 0;

          const pointRadius = 1 + wobble + spikeAmount + waveDisp;
          ox *= pointRadius;
          oy *= pointRadius;
          oz *= pointRadius;

          // Rotate on Y axis (primary)
          let [rx, ry, rz] = rotateYAxis(ox, oy, oz, rotationY);
          // Rotate on X axis (slow tilt)
          [rx, ry, rz] = rotateXAxis(rx, ry, rz, rotationX);

          // Depth-based opacity: front faces bright, back faces dim
          const depthFactor = (rz + 1.3) / 2.6;
          const waveGlow = waveDisp * 0.8; // points in wavefront glow brighter
          const opacity = (set.baseOpacity + opacityBoost + waveGlow) * (0.15 + Math.max(0, depthFactor) * 0.85);

          // Point size with treble boost + wave expansion
          const waveSizeBoost = waveDisp * 4;
          const pointSize = set.size + (set.isSphere ? sizeBoost + waveSizeBoost : 0);

          // Project to 2D
          const screenX = cx + rx * radius;
          const screenY = cy - ry * radius;

          ctx.fillStyle = fg;
          ctx.globalAlpha = Math.min(opacity, 0.6); // clamp max opacity
          ctx.fillRect(Math.round(screenX - pointSize / 2), Math.round(screenY - pointSize / 2), pointSize, pointSize);
        }
      }

      ctx.globalAlpha = 1;
    }

    function animate() {
      // Read audio for dynamic rotation speed
      const { bass } = audioState.isPlaying ? getFrequencyBands() : { bass: 0 };
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
      className="fixed inset-0 w-full h-full z-[1] pointer-events-none text-accent-primary"
      aria-hidden="true"
    />
  );
}
