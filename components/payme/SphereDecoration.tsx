"use client";

import { useRef, useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";

// ─── Point generators ───────────────────────────────────────────────

function genSpherePoints(count: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = ga * i;
    pts.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
  }
  return pts;
}

function genLatPoints(latCount: number, ppr: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let lat = 1; lat < latCount; lat++) {
    const phi = (Math.PI * lat) / latCount;
    const y = Math.cos(phi);
    const rr = Math.sin(phi);
    for (let i = 0; i < ppr; i++) {
      const theta = (2 * Math.PI * i) / ppr;
      pts.push([Math.cos(theta) * rr, y, Math.sin(theta) * rr]);
    }
  }
  return pts;
}

function genLonPoints(merCount: number, ppm: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let mer = 0; mer < merCount; mer++) {
    const theta = (2 * Math.PI * mer) / merCount;
    for (let i = 0; i <= ppm; i++) {
      const phi = (Math.PI * i) / ppm;
      const y = Math.cos(phi);
      const rr = Math.sin(phi);
      pts.push([Math.cos(theta) * rr, y, Math.sin(theta) * rr]);
    }
  }
  return pts;
}

// ─── Static data ─────────────────────────────────────────────────────

const MAIN_SPHERE = genSpherePoints(650);
const LAT_PTS = genLatPoints(10, 56);
const LON_PTS = genLonPoints(16, 38);
const ORB_SPHERE_LG = genSpherePoints(140);
const ORB_SPHERE_SM = genSpherePoints(80);
const ORB_SPHERE_XS = genSpherePoints(50);
const SEC_SPHERE = genSpherePoints(180);

// tilt: X-axis foreshortening angle  rotation: Z-axis ring rotation
// speed: radians per time-unit (time += 0.016 per frame ≈ 60fps)
const ORBITS = [
  {
    tilt: 0.1 * Math.PI,
    rotation: 0.0,
    radiusMult: 1.52,
    speed: 0.008,
    startAngle: 0,
    scaleMult: 0.1,
    pts: ORB_SPHERE_LG,
  },
  {
    tilt: 0.38 * Math.PI,
    rotation: 0.55,
    radiusMult: 1.88,
    speed: 0.005,
    startAngle: Math.PI * 0.7,
    scaleMult: 0.08,
    pts: ORB_SPHERE_SM,
  },
  {
    tilt: 0.58 * Math.PI,
    rotation: -0.3,
    radiusMult: 2.25,
    speed: 0.003,
    startAngle: Math.PI * 1.4,
    scaleMult: 0.065,
    pts: ORB_SPHERE_XS,
  },
] as const;

// ─── Transforms ──────────────────────────────────────────────────────

function ry(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a),
    s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}

function rx(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a),
    s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}

// ─── Component ────────────────────────────────────────────────────────

export function SphereDecoration() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    let rotYAngle = 0;
    let time = 0;
    let animId = 0;

    const FG = "#1a1a1a";
    const ACCENT = "#a35b42";

    function drawDotSphere(
      pts: readonly [number, number, number][],
      cx: number,
      cy: number,
      r: number,
      rotYa: number,
      rotXa: number,
      pxSize: number,
      baseAlpha: number,
      color: string,
      wobble = 0.025
    ) {
      for (let i = 0; i < pts.length; i++) {
        if (!ctx) {
          return;
        }
        const [bx, by, bz] = pts[i];
        const w = wobble * Math.sin(time * 1.2 + i * 0.47);
        const pr = 1 + w;
        let [rx2, ry2, rz2] = ry(bx * pr, by * pr, bz * pr, rotYa);
        [rx2, ry2, rz2] = rx(rx2, ry2, rz2, rotXa);
        const depth = (rz2 + 1.3) / 2.6;
        const alpha = baseAlpha * (0.12 + Math.max(0, depth) * 0.88);
        ctx.fillStyle = color;
        ctx.globalAlpha = Math.min(alpha, 0.55);
        ctx.fillRect(Math.round(cx + rx2 * r - pxSize / 2), Math.round(cy - ry2 * r - pxSize / 2), pxSize, pxSize);
      }
    }

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cssW = w / dpr;
      const isMobile = cssW < 768;
      const pxBase = Math.max(2, Math.round(2.5 * dpr));
      const latLonPx = Math.max(1.5, Math.round(2 * dpr));
      const lw = Math.max(0.5, dpr * 0.5);

      // ─── Main sphere position + size ───
      const mainCx = isMobile ? w * 0.5 : w * 0.7;
      const mainCy = isMobile ? h * 0.36 : h * 0.5;
      const mainR = Math.min(w, h) * (isMobile ? 0.2 : 0.26);
      const rotXa = Math.sin(time * 0.0009) * 0.14;

      // Dot-cloud sphere
      drawDotSphere(MAIN_SPHERE, mainCx, mainCy, mainR, rotYAngle, rotXa, pxBase, 0.3, FG);

      // Lat / lon wireframe
      for (const pts of [LAT_PTS, LON_PTS] as const) {
        for (let i = 0; i < pts.length; i++) {
          const [bx, by, bz] = pts[i];
          let [rx2, ry2, rz2] = ry(bx, by, bz, rotYAngle);
          [rx2, ry2, rz2] = rx(rx2, ry2, rz2, rotXa);
          const depth = (rz2 + 1.3) / 2.6;
          const alpha = 0.14 * (0.12 + Math.max(0, depth) * 0.88);
          ctx.fillStyle = FG;
          ctx.globalAlpha = Math.min(alpha, 0.22);
          ctx.fillRect(
            Math.round(mainCx + rx2 * mainR - latLonPx / 2),
            Math.round(mainCy - ry2 * mainR - latLonPx / 2),
            latLonPx,
            latLonPx
          );
        }
      }

      // ─── Orbital rings + orbiting dot-spheres ───
      for (let oi = 0; oi < ORBITS.length; oi++) {
        const orb = ORBITS[oi];
        const orbitR = mainR * orb.radiusMult;
        const cosT = Math.cos(orb.tilt);
        const sinT = Math.sin(orb.tilt);
        const cosRot = Math.cos(orb.rotation);
        const sinRot = Math.sin(orb.rotation);

        // Ellipse orbit track
        ctx.beginPath();
        ctx.ellipse(mainCx, mainCy, orbitR, Math.abs(orbitR * cosT), orb.rotation, 0, Math.PI * 2);
        ctx.strokeStyle = FG;
        ctx.lineWidth = lw;
        ctx.setLineDash([3 * dpr, 8 * dpr]);
        ctx.globalAlpha = 0.065;
        ctx.stroke();
        ctx.setLineDash([]);

        // Planet screen position (tilted flat-circle orbit)
        const angle = orb.startAngle + orb.speed * time;
        const fx = Math.cos(angle) * orbitR;
        const fz = Math.sin(angle) * orbitR;
        const dotX = mainCx + fx * cosRot - fz * cosT * sinRot;
        const dotY = mainCy - (fx * sinRot + fz * cosT * cosRot);
        const dotDepth = ((fz * sinT) / orbitR + 1) / 2;

        const planetR = orb.scaleMult * mainR;
        const orbRotY = time * (0.9 + oi * 0.35) + oi * 2.1;

        for (let i = 0; i < orb.pts.length; i++) {
          const [bx, by, bz] = orb.pts[i];
          const [rx2, ry2, rz2] = ry(bx, by, bz, orbRotY);
          const ptDepth = (rz2 + 1) / 2;
          const alpha = (0.28 + ptDepth * 0.52) * (0.35 + dotDepth * 0.65);
          const dp = Math.max(2, Math.round((2.5 - oi * 0.4) * dpr));
          ctx.fillStyle = ACCENT;
          ctx.globalAlpha = Math.min(alpha, 0.7);
          ctx.fillRect(Math.round(dotX + rx2 * planetR - dp / 2), Math.round(dotY - ry2 * planetR - dp / 2), dp, dp);
        }

        // Node marker on orbit track (opposite side)
        const nodeAngle = angle + Math.PI;
        const nx = Math.cos(nodeAngle) * orbitR;
        const nz = Math.sin(nodeAngle) * orbitR;
        const nodeX = mainCx + nx * cosRot - nz * cosT * sinRot;
        const nodeY = mainCy - (nx * sinRot + nz * cosT * cosRot);
        const ns = Math.max(3, Math.round(3 * dpr));
        ctx.fillStyle = FG;
        ctx.globalAlpha = 0.08;
        ctx.fillRect(Math.round(nodeX - ns / 2), Math.round(nodeY - ns / 2), ns, ns);
      }

      // ─── EVE targeting reticle around main sphere ───
      // Outer arcs (top-right + bottom-left quadrants)
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = lw;
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(mainCx, mainCy, mainR * 1.38, -0.55, 0.55);
      ctx.globalAlpha = 0.13;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(mainCx, mainCy, mainR * 1.38, Math.PI - 0.55, Math.PI + 0.55);
      ctx.globalAlpha = 0.09;
      ctx.stroke();

      // Inner arc (small bracket — top)
      ctx.beginPath();
      ctx.arc(mainCx, mainCy, mainR * 1.15, -0.25, 0.25);
      ctx.strokeStyle = FG;
      ctx.globalAlpha = 0.07;
      ctx.stroke();

      // Cross-hair extensions
      ctx.strokeStyle = FG;
      ctx.lineWidth = lw;
      ctx.globalAlpha = 0.06;
      // Left
      ctx.beginPath();
      ctx.moveTo(mainCx - mainR * 1.7, mainCy);
      ctx.lineTo(mainCx - mainR * 1.15, mainCy);
      ctx.stroke();
      // Right
      ctx.beginPath();
      ctx.moveTo(mainCx + mainR * 1.15, mainCy);
      ctx.lineTo(mainCx + mainR * 1.7, mainCy);
      ctx.stroke();
      // Up
      ctx.beginPath();
      ctx.moveTo(mainCx, mainCy - mainR * 1.7);
      ctx.lineTo(mainCx, mainCy - mainR * 1.15);
      ctx.stroke();

      // Tick marks on reticle
      const tickAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      const tickR = mainR * 1.38;
      for (const ta of tickAngles) {
        const tx = mainCx + Math.cos(ta) * tickR;
        const ty = mainCy - Math.sin(ta) * tickR;
        ctx.fillStyle = ACCENT;
        ctx.globalAlpha = 0.18;
        const ts = Math.max(3, Math.round(3.5 * dpr));
        ctx.fillRect(Math.round(tx - ts / 2), Math.round(ty - ts / 2), ts, ts);
      }

      // ─── Secondary small sphere — top-left corner (desktop only) ───
      if (!isMobile) {
        const s2cx = w * 0.11;
        const s2cy = h * 0.22;
        const s2r = mainR * 0.26;
        drawDotSphere(
          SEC_SPHERE,
          s2cx,
          s2cy,
          s2r,
          rotYAngle * 0.65 + 1.2,
          0.18,
          Math.max(1.5, Math.round(1.8 * dpr)),
          0.2,
          FG,
          0.015
        );

        // Bracket arcs around secondary sphere
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.arc(s2cx, s2cy, s2r * 1.55, -0.45, 0.45);
        ctx.globalAlpha = 0.13;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s2cx, s2cy, s2r * 1.55, Math.PI - 0.45, Math.PI + 0.45);
        ctx.globalAlpha = 0.08;
        ctx.stroke();

        // Connector line from secondary to main sphere (faint)
        ctx.beginPath();
        ctx.moveTo(s2cx + s2r * 1.2, s2cy + s2r * 0.5);
        ctx.lineTo(mainCx - mainR * 1.1, mainCy - mainR * 0.6);
        ctx.strokeStyle = FG;
        ctx.setLineDash([2 * dpr, 10 * dpr]);
        ctx.globalAlpha = 0.04;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.globalAlpha = 1;
    }

    if (reduced) {
      draw();
      return () => window.removeEventListener("resize", resize);
    }

    function animate() {
      rotYAngle += 0.0038;
      time += 0.016;
      draw();
      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      aria-hidden="true"
    />
  );
}
