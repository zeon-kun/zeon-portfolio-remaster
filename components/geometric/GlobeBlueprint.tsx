"use client";

import { useRef, useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { getFrequencyBands, audioState } from "@/lib/audio";
import { globeState } from "@/lib/globe-state";
import type { SlideId } from "@/lib/globe-state";
import { PROJECTS } from "@/lib/content";

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
const LOADER_SPHERE_POINTS = generateSpherePoints(200);
const LAT_POINTS = generateLatitudePoints(10, 60);
const LON_POINTS = generateLongitudePoints(16, 40);

// Small sphere for each planet (fewer points)
const PLANET_SPHERE_POINTS = generateSpherePoints(80);

const SPIKE_INTERVAL = 15;
const SPIKE_INDICES = new Set(SPHERE_POINTS.map((_, i) => i).filter((i) => i % SPIKE_INTERVAL === 0));

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// Per-slide globe configurations
const SLIDE_CONFIG: Record<SlideId, { cxFrac: number; cyFrac: number; rFrac: number }> = {
  hero: { cxFrac: 0.67, cyFrac: 0.5, rFrac: 0.32 },
  about: { cxFrac: 0.88, cyFrac: 0.18, rFrac: 0.14 },
  experience: { cxFrac: 0.15, cyFrac: 0.82, rFrac: 0.16 },
  projects: { cxFrac: 0.5, cyFrac: 0.5, rFrac: 0.16 }, // Same sphere size as experience
  ambient: { cxFrac: 0.88, cyFrac: 0.15, rFrac: 0.12 }, // Small decorative top-right
};

// Solar system style: all orbits on same plane, viewed from a fixed tilt
const SYSTEM_TILT = Math.PI * 0.18; // ~32 degrees — view angle of the orbital plane
const COS_TILT = Math.cos(SYSTEM_TILT);
const SIN_TILT = Math.sin(SYSTEM_TILT);

const PLANET_CONFIGS = PROJECTS.map((_, i) => ({
  orbitRadiusMult: 1.3 + i * 0.35, // Compact — fits within loader-like footprint
  speed: 0.22 / (1 + i * 0.4),
  startAngle: (Math.PI * 2 * i) / PROJECTS.length + Math.PI * 0.15 * i,
  planetRadius: 0.18 - i * 0.02, // Smaller planet spheres
}));

interface BeatWave {
  ox: number;
  oy: number;
  oz: number;
  birthTime: number;
  intensity: number;
}

export function BlueprintElements() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const dpr = window.devicePixelRatio || 1;

    // Planet screen positions for hit testing (updated every frame)
    const planetScreenPos: { x: number; y: number; r: number }[] = PROJECTS.map(() => ({ x: 0, y: 0, r: 0 }));
    // Current opacity for planets (lerp for smooth fade in/out)
    let planetOpacity = 0;

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

    let currentCx = 0;
    let currentCy = 0;
    let currentRadius = 0;
    let lerpInitialized = false;

    // Globe visibility toggle — lerps to 0 when hidden, 1 when visible
    let visibilityScale = 1.0;

    const LERP_FACTOR = 0.04;

    const BASE_ROTATION_SPEED = 0.003;
    const WOBBLE_AMPLITUDE = 0.06;
    const WOBBLE_FREQ = 1.2;
    const SPIKE_EXTEND = 0.18;
    const X_TILT_SPEED = 0.0008;
    const X_TILT_AMOUNT = 0.15;
    const LOADER_ROTATION_SPEED = 0.008;

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
      const activeSlide = globeState.activeSlide;

      let t = 0;
      if (phase === "transitioning") {
        const elapsed = performance.now() - globeState.transitionStart;
        t = Math.min(1, elapsed / globeState.transitionDuration);
      } else if (phase === "ready") {
        t = 1;
      }

      const easedT = phase === "loading" ? 0 : easeOutExpo(t);

      const slideConf = SLIDE_CONFIG[activeSlide];
      let targetCx = w * slideConf.cxFrac;
      let targetCy = h * slideConf.cyFrac;
      let targetRadius = Math.min(w, h) * slideConf.rFrac;

      const cssWidth = w / dpr;
      const isMobile = cssWidth < 768;

      // Globe visibility toggle (lerp for smooth fade)
      const visTarget = globeState.globeVisible ? 1.0 : 0.0;
      visibilityScale += (visTarget - visibilityScale) * 0.08;
      // Mobile: reduce base opacity so globe is less distracting
      const mobileScale = (isMobile ? 0.4 : 1.0) * visibilityScale;

      if (activeSlide === "projects") {
        if (isMobile) {
          // Decorative: bottom-center, smaller
          targetCx = w * 0.5;
          targetCy = h * 0.75;
          targetRadius = Math.min(w, h) * 0.12;
        } else {
          // Center of right half, experience-sized sphere (rFrac: 0.16 from config)
          const rightPanelStart = w * 0.5;
          const rightPanelWidth = w * 0.5;
          targetCx = rightPanelStart + rightPanelWidth * 0.5;
        }
      }

      // Cap globe diameter to 1/2 screen width
      targetRadius = Math.min(targetRadius, w * 0.25);

      const loadCx = w * 0.5;
      const loadCy = h * 0.5;

      let cx: number, cy: number, baseRadius: number;

      if (phase === "loading" || phase === "transitioning") {
        cx = loadCx + (targetCx - loadCx) * easedT;
        cy = loadCy + (targetCy - loadCy) * easedT;
        const loaderRadius = 60 * dpr;
        baseRadius = loaderRadius + (targetRadius - loaderRadius) * easedT;
        currentCx = cx;
        currentCy = cy;
        currentRadius = baseRadius;
        lerpInitialized = true;
      } else {
        if (!lerpInitialized) {
          currentCx = targetCx;
          currentCy = targetCy;
          currentRadius = targetRadius;
          lerpInitialized = true;
        }
        currentCx += (targetCx - currentCx) * LERP_FACTOR;
        currentCy += (targetCy - currentCy) * LERP_FACTOR;
        currentRadius += (targetRadius - currentRadius) * LERP_FACTOR;
        cx = currentCx;
        cy = currentCy;
        baseRadius = currentRadius;
      }

      const burstFactor = phase === "transitioning" ? (1 - easedT) * 0.3 : 0;

      const isReady = phase === "ready";
      const { bass, mid, treble } =
        isReady && audioState.isPlaying ? getFrequencyBands() : { bass: 0, mid: 0, treble: 0 };

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
      const orbitBaseRadius = baseRadius;

      const opacityBoost = mid * 0.13;
      const sizeBoost = treble * 2;
      const basePixelSize = Math.max(3, Math.round(3 * dpr));

      const slideOpacityScale = activeSlide === "hero" ? 1.0 : 0.7;

      const fg = getComputedStyle(canvas).getPropertyValue("color").trim();

      const hasWaves = activeWaves.length > 0;

      const loaderPointSize = Math.max(2, Math.round(2.5 * dpr));

      // Draw loader sphere
      if (phase === "loading" || (phase === "transitioning" && easedT < 1)) {
        const loaderOpacityScale = phase === "loading" ? 1 : 1 - easedT;
        for (let idx = 0; idx < LOADER_SPHERE_POINTS.length; idx++) {
          const [bx, by, bz] = LOADER_SPHERE_POINTS[idx];
          const [rx, ry, rz] = rotateYAxis(bx, by, bz, rotationY);
          const depth = (rz + 1) / 2;
          const alpha = 0.15 * (0.2 + depth * 0.8) * loaderOpacityScale * mobileScale;
          const screenX = cx + rx * radius;
          const screenY = cy - ry * radius;
          ctx.fillStyle = fg;
          ctx.globalAlpha = Math.min(alpha, 0.6);
          ctx.fillRect(
            Math.round(screenX - loaderPointSize / 2),
            Math.round(screenY - loaderPointSize / 2),
            loaderPointSize,
            loaderPointSize
          );
        }
      }

      // Draw full sphere
      if (phase !== "loading") {
        const sphereOpacityScale = easedT * slideOpacityScale;

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
            (0.35 + opacityBoost + waveGlow) * (0.15 + Math.max(0, depthFactor) * 0.85) * sphereOpacityScale * mobileScale;

          const waveSizeBoost = waveDisp * 4;
          const pointSize = basePixelSize + sizeBoost + waveSizeBoost;

          const screenX = cx + rx * radius;
          const screenY = cy - ry * radius;

          ctx.fillStyle = fg;
          ctx.globalAlpha = Math.min(opacity, 0.6);
          ctx.fillRect(Math.round(screenX - pointSize / 2), Math.round(screenY - pointSize / 2), pointSize, pointSize);
        }
      }

      // Draw wireframe
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
              (set.baseOpacity * easedT + opacityBoost + waveGlow) *
              (0.15 + Math.max(0, depthFactor) * 0.85) *
              slideOpacityScale *
              mobileScale;

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
              pointSize
            );
          }
        }
      }

      // ─── Orbiting project planets — solar system style ───
      const wantPlanets = activeSlide === "projects" && isReady && globeState.showPlanetarium;
      const targetPlanetOpacity = wantPlanets ? 1 : 0;
      planetOpacity += (targetPlanetOpacity - planetOpacity) * 0.06;

      if (planetOpacity > 0.01) {
        const planetPixelSize = Math.max(2, Math.round(2 * dpr));
        const accentColor = getComputedStyle(canvas).getPropertyValue("--accent-primary")?.trim() || "#a35b42";
        const fontFamily = getComputedStyle(canvas).fontFamily;

        for (let pi = 0; pi < PROJECTS.length; pi++) {
          const conf = PLANET_CONFIGS[pi];
          const orbitDist = conf.orbitRadiusMult * orbitBaseRadius;

          // ── Draw orbit track (projected ellipse) ──
          // A circle in the XZ plane tilted by SYSTEM_TILT projects to an ellipse:
          //   screen-X radius = orbitDist (full)
          //   screen-Y radius = orbitDist * cos(tilt) (foreshortened)
          const ellipseRx = orbitDist;
          const ellipseRy = orbitDist * COS_TILT;

          ctx.beginPath();
          ctx.ellipse(cx, cy, ellipseRx, ellipseRy, 0, 0, Math.PI * 2);
          ctx.strokeStyle = fg;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.08 * planetOpacity;
          ctx.stroke();

          // ── Compute planet position on orbit ──
          const orbitAngle = conf.startAngle + conf.speed * time;

          // Flat circle in XZ, then tilt by viewing angle
          const flatX = Math.cos(orbitAngle) * orbitDist;
          const flatZ = Math.sin(orbitAngle) * orbitDist;

          // Project: X stays, Y = -Z * sin(tilt), depth = Z * cos(tilt)
          const planetScreenX = cx + flatX;
          const planetScreenY = cy - flatZ * COS_TILT;
          const planetDepthZ = flatZ * SIN_TILT;
          const planetDepth = (planetDepthZ / orbitDist + 1) / 2; // 0=far, 1=near
          const planetR = conf.planetRadius * radius;

          // Store for hit testing (CSS pixels)
          planetScreenPos[pi] = {
            x: planetScreenX / dpr,
            y: planetScreenY / dpr,
            r: Math.max(22, planetR / dpr),
          };

          // ── Draw planet (small point-sphere) ──
          const depthScale = 0.5 + planetDepth * 0.5;
          for (let idx = 0; idx < PLANET_SPHERE_POINTS.length; idx++) {
            const [bx, by, bz] = PLANET_SPHERE_POINTS[idx];
            const [rx, ry, rz] = rotateYAxis(bx, by, bz, time * 0.8 + pi * 2);

            const ptDepth = (rz + 1) / 2;
            const alpha = (0.25 + ptDepth * 0.55) * planetOpacity * depthScale;

            const screenX = planetScreenX + rx * planetR;
            const screenY = planetScreenY - ry * planetR;

            ctx.fillStyle = accentColor;
            ctx.globalAlpha = Math.min(alpha, 0.7);
            ctx.fillRect(
              Math.round(screenX - planetPixelSize / 2),
              Math.round(screenY - planetPixelSize / 2),
              planetPixelSize,
              planetPixelSize
            );
          }

          // ── Label ──
          const labelOffset = planetR + 10 * dpr;
          ctx.globalAlpha = 0.65 * planetOpacity * depthScale;
          ctx.fillStyle = fg;
          ctx.font = `bold ${Math.round(10 * dpr)}px ${fontFamily}`;
          ctx.textAlign = "center";
          ctx.fillText(PROJECTS[pi].title, planetScreenX, planetScreenY + labelOffset);

          ctx.globalAlpha = 0.35 * planetOpacity * depthScale;
          ctx.font = `${Math.round(8 * dpr)}px monospace`;
          ctx.fillText(String(PROJECTS[pi].year), planetScreenX, planetScreenY + labelOffset + 12 * dpr);
        }
      }

      ctx.globalAlpha = 1;

      // Update overlay pointer-events based on whether planets are visible
      const overlay = overlayRef.current;
      if (overlay) {
        overlay.style.pointerEvents = planetOpacity > 0.3 ? "auto" : "none";
      }
    }

    // ─── Click and hover handlers for planet hit testing (on overlay) ───
    const overlay = overlayRef.current;

    function handleOverlayClick(e: MouseEvent) {
      if (planetOpacity < 0.3) return;
      // planetScreenPos coordinates are CSS pixels relative to viewport origin (canvas is fixed inset-0)
      const mx = e.clientX;
      const my = e.clientY;

      for (let i = 0; i < planetScreenPos.length; i++) {
        const p = planetScreenPos[i];
        const dx = mx - p.x;
        const dy = my - p.y;
        if (dx * dx + dy * dy < p.r * p.r) {
          globeState.onProjectClick?.(i);
          return;
        }
      }
    }

    function handleOverlayMouseMove(e: MouseEvent) {
      if (!overlay || planetOpacity < 0.3) return;
      const mx = e.clientX;
      const my = e.clientY;

      let overPlanet = false;
      for (let i = 0; i < planetScreenPos.length; i++) {
        const p = planetScreenPos[i];
        const dx = mx - p.x;
        const dy = my - p.y;
        if (dx * dx + dy * dy < p.r * p.r) {
          overPlanet = true;
          break;
        }
      }
      overlay.style.cursor = overPlanet ? "pointer" : "default";
    }

    if (overlay) {
      overlay.addEventListener("click", handleOverlayClick);
      overlay.addEventListener("mousemove", handleOverlayMouseMove);
    }

    function animate() {
      const phase = globeState.phase;

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

      if (phase === "transitioning") {
        const elapsed = performance.now() - globeState.transitionStart;
        if (elapsed >= globeState.transitionDuration) {
          globeState.setPhase("ready");
        }
      }

      animRef.current = requestAnimationFrame(animate);
    }

    if (reduced) {
      if (globeState.phase === "transitioning") {
        globeState.phase = "ready";
      }
      time = 0;
      draw();

      const pollInterval = setInterval(() => {
        if (globeState.phase === "transitioning") {
          globeState.setPhase("ready");
        }
        draw();
      }, 100);

      return () => {
        clearInterval(pollInterval);
        if (overlay) {
          overlay.removeEventListener("click", handleOverlayClick);
          overlay.removeEventListener("mousemove", handleOverlayMouseMove);
        }
        window.removeEventListener("resize", resize);
      };
    } else {
      animate();
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      if (overlay) {
        overlay.removeEventListener("click", handleOverlayClick);
        overlay.removeEventListener("mousemove", handleOverlayMouseMove);
      }
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-5 pointer-events-none text-accent-primary"
        aria-hidden="true"
      />
      {/* Overlay for planet click/hover — right half only, above slide content */}
      <div
        ref={overlayRef}
        className="fixed top-0 right-0 w-1/2 h-full z-15 pointer-events-none hidden md:block"
        aria-hidden="true"
      />
    </>
  );
}
