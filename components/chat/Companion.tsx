"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";

type Says = keyof Dictionary["ui"]["companion"]["says"];
type Mood = "default" | "music" | "greet" | "ask" | "composer" | "thinking" | "external" | "cv" | "figure" | "click" | "sleep" | "wake";

// Faces are the same in every language; what the tag says lives in the dictionary.
const FACES: Record<Mood, string> = {
  default: "(・ω・)",
  music: "(´▽`)♪",
  greet: "(＾▽＾)ノ",
  ask: "(＾▽＾)",
  composer: "(・_・?)",
  thinking: "(°ロ°)",
  external: "(￣▽￣)ノ",
  cv: "(｀・ω・´)",
  figure: "(°o°)",
  click: "(＞ω＜)",
  sleep: "(－_－) zzZ",
  wake: "(°□°)",
};

const SPEAKS: Partial<Record<Mood, Says>> = {
  greet: "greet",
  ask: "ask",
  composer: "composer",
  thinking: "thinking",
  external: "external",
  cv: "cv",
  figure: "figure",
};

// Checked in order — the first match wins, so a figure inside a starter card counts as the card.
const TARGETS: [string, Mood][] = [
  ["[data-companion='audio']", "music"],
  ['a[href="/api/cv"]', "cv"],
  ['a[target="_blank"]', "external"],
  ["[data-companion='composer']", "composer"],
  ["[data-companion='ask']", "ask"],
  ["div[role='img']", "figure"],
];

const GREETED_KEY = "portfolio-companion-greeted";
const GREET_MS = 2600;
const CLICK_MS = 320;
const WAKE_MS = 700;

function targetMood(target: EventTarget | null): Mood {
  if (!(target instanceof Element)) return "default";
  for (const [selector, mood] of TARGETS) {
    if (target.closest(selector)) return mood;
  }
  return "default";
}

/** True the first time it is called in a visit. Without storage, never — better silent than repetitive. */
function claimGreeting(): boolean {
  try {
    if (sessionStorage.getItem(GREETED_KEY)) return false;
    sessionStorage.setItem(GREETED_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

type CompanionProps = {
  dict: Dictionary;
  /** An answer is loading. */
  thinking: boolean;
  /** Long-form reading: face only, no chatter. */
  quiet: boolean;
  onDismiss: () => void;
};

/** The pill itself: face, name, and whatever it is saying. */
function Tag({ dict, mood, quiet, corner }: Pick<CompanionProps, "dict" | "quiet"> & { mood: Mood; corner: string }) {
  const sayKey = SPEAKS[mood];
  const says = sayKey && !(quiet && mood !== "greet") ? dict.ui.companion.says[sayKey] : null;
  const showName = !quiet || mood === "greet";

  return (
    <span
      className={`flex items-center gap-1.5 whitespace-nowrap px-2 py-1 text-[11px] font-bold text-background shadow-[0_4px_14px_-6px_rgba(26,26,26,0.45)] transition-[transform,background-color] duration-150 ease-out ${
        mood === "sleep" ? "bg-[#8a8278]" : "bg-accent-primary"
      } ${mood === "click" ? "scale-90" : "scale-100"} ${corner}`}
    >
      <span className="font-jp">{FACES[mood]}</span>
      {showName && <span className="font-mono tracking-wide">{dict.ui.companion.name}</span>}
      {says && (
        <span className="border-l border-background/40 pl-1.5 font-mono text-[10px] font-normal text-background/90">{says}</span>
      )}
    </span>
  );
}

// ── Pointer devices: trails the real cursor ──────────────────────────────

const POINTER_IDLE_MS = 8000;
const FOLLOW = 0.2; // share of the remaining distance covered per frame at 60fps
const EDGE_X = 230; // flip the tag to the other side this close to the right / bottom edge
const EDGE_Y = 70;

function PointerCompanion({ dict, thinking, quiet }: CompanionProps) {
  const tagRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState<Mood>("default");
  // A short-lived mood (greeting, click, waking) that outranks whatever is hovered.
  const [flash, setFlash] = useState<Mood | null>(null);
  const [asleep, setAsleep] = useState(false);
  const [flip, setFlip] = useState({ x: false, y: false });

  useEffect(() => {
    const tag = tagRef.current;
    if (!tag) return;

    const reduced = prefersReducedMotion();
    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let raf = 0;
    let last = 0;
    let placed = false;
    let sleeping = false;
    let flashTimer = 0;
    let idleTimer = 0;

    function place() {
      tag!.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    }

    function frame(now: number) {
      // Frame-rate independent easing toward the pointer.
      const k = reduced ? 1 : 1 - Math.pow(1 - FOLLOW, (now - last) / (1000 / 60));
      last = now;
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      place();
      // Stop once it has caught up, so a resting pointer costs nothing.
      raf = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.2 ? requestAnimationFrame(frame) : 0;
    }

    function showFlash(mood: Mood, ms: number) {
      window.clearTimeout(flashTimer);
      setFlash(mood);
      flashTimer = window.setTimeout(() => setFlash(null), ms);
    }

    function armIdle() {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        sleeping = true;
        setAsleep(true);
      }, POINTER_IDLE_MS);
    }

    function onMove(e: PointerEvent) {
      target.x = e.clientX;
      target.y = e.clientY;

      if (!placed) {
        placed = true;
        pos.x = target.x;
        pos.y = target.y;
        place();
        setVisible(true);
        if (claimGreeting()) showFlash("greet", GREET_MS);
      }

      if (sleeping) {
        sleeping = false;
        setAsleep(false);
        showFlash("wake", WAKE_MS);
      }
      armIdle();

      const x = e.clientX > window.innerWidth - EDGE_X;
      const y = e.clientY > window.innerHeight - EDGE_Y;
      setFlip((prev) => (prev.x === x && prev.y === y ? prev : { x, y }));

      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }

    const onOver = (e: PointerEvent) => setHover(targetMood(e.target));
    const onDown = () => showFlash("click", CLICK_MS);
    const onLeave = () => setVisible(false);
    const onEnter = () => placed && setVisible(true);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", onEnter);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(flashTimer);
      window.clearTimeout(idleTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerenter", onEnter);
    };
  }, []);

  const mood: Mood = flash ?? (asleep ? "sleep" : thinking ? "thinking" : hover);

  return (
    <div
      ref={tagRef}
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-[70] transition-opacity duration-200 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Offset from the pointer tip; flips to the other side near the right and bottom edges. */}
      <div className={`absolute origin-top-left ${flip.x ? "right-3" : "left-3.5"} ${flip.y ? "bottom-2" : "top-4"}`}>
        <Tag dict={dict} mood={mood} quiet={quiet} corner={flip.x ? "rounded-[10px_2px_10px_10px]" : "rounded-[2px_10px_10px_10px]"} />
      </div>
    </div>
  );
}

// ── Touch screens: lives on the dock, hops to what you tap ───────────────

const TOUCH_IDLE_MS = 12000;
const HOP_MS = 1500;
const PERCH_INSET = 16;
const PERCH_OVERLAP = 5; // how far the tag sits down over the dock's top edge
const TAG_HEIGHT = 26;
const HOP_LIFT = 52; // land above the finger, where it can be seen
const HOP_MAX_WIDTH = 190;
const TOP_BAR = 64;

function TouchCompanion({ dict, thinking, quiet, onDismiss }: CompanionProps) {
  const selfRef = useRef<HTMLButtonElement>(null);
  const [perch, setPerch] = useState<{ x: number; y: number } | null>(null);
  const [hop, setHop] = useState<{ x: number; y: number; mood: Mood } | null>(null);
  const [flash, setFlash] = useState<Mood | null>(null);
  const [asleep, setAsleep] = useState(false);

  // The perch follows the dock, whose height changes with the layout.
  useEffect(() => {
    const dock = document.querySelector<HTMLElement>("[data-dock]");
    if (!dock) return;
    const update = () => {
      const rect = dock.getBoundingClientRect();
      setPerch({ x: rect.left + PERCH_INSET, y: rect.top - TAG_HEIGHT + PERCH_OVERLAP });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(dock);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    let sleeping = false;
    let flashTimer = 0;
    let hopTimer = 0;
    let idleTimer = 0;

    function showFlash(mood: Mood, ms: number) {
      window.clearTimeout(flashTimer);
      setFlash(mood);
      flashTimer = window.setTimeout(() => setFlash(null), ms);
    }

    function armIdle() {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        sleeping = true;
        setAsleep(true);
      }, TOUCH_IDLE_MS);
    }

    function onDown(e: PointerEvent) {
      // Its own tap is the dismiss button, not something to react to.
      if (selfRef.current?.contains(e.target as Node)) return;

      const wasSleeping = sleeping;
      sleeping = false;
      setAsleep(false);
      armIdle();

      const mood = targetMood(e.target);
      if (mood === "default") {
        showFlash(wasSleeping ? "wake" : "click", wasSleeping ? WAKE_MS : CLICK_MS);
        return;
      }

      window.clearTimeout(hopTimer);
      setHop({
        x: Math.min(Math.max(e.clientX - 40, 8), window.innerWidth - HOP_MAX_WIDTH),
        y: Math.max(TOP_BAR, e.clientY - HOP_LIFT),
        mood,
      });
      hopTimer = window.setTimeout(() => setHop(null), HOP_MS);
    }

    const greetTimer = window.setTimeout(() => claimGreeting() && showFlash("greet", GREET_MS), 600);
    armIdle();
    window.addEventListener("pointerdown", onDown, { passive: true });

    return () => {
      window.clearTimeout(greetTimer);
      window.clearTimeout(flashTimer);
      window.clearTimeout(hopTimer);
      window.clearTimeout(idleTimer);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  if (!perch) return null;

  const at = hop ?? perch;
  const mood: Mood = hop?.mood ?? flash ?? (asleep ? "sleep" : thinking ? "thinking" : "default");

  return (
    <button
      ref={selfRef}
      type="button"
      onClick={onDismiss}
      aria-label={dict.ui.companion.hide}
      style={{ transform: `translate3d(${at.x}px, ${at.y}px, 0)` }}
      className="fade-in fixed left-0 top-0 z-[70] transition-transform duration-300 ease-(--ease-drawer)"
    >
      <Tag dict={dict} mood={mood} quiet={quiet} corner="rounded-[10px_10px_10px_2px]" />
    </button>
  );
}

/**
 * A small name tag with a kaomoji face that keeps the visitor company. With a mouse it trails the
 * cursor; on touch screens it perches on the dock and hops to whatever is tapped.
 */
export function Companion(props: CompanionProps) {
  const [mode, setMode] = useState<"pointer" | "touch" | null>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setMode(fine.matches ? "pointer" : "touch");
    update();
    fine.addEventListener("change", update);
    return () => fine.removeEventListener("change", update);
  }, []);

  if (mode === "pointer") return <PointerCompanion {...props} />;
  if (mode === "touch") return <TouchCompanion {...props} />;
  return null;
}
