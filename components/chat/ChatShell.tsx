"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Eraser, FileDown, Github, Linkedin, MousePointer2 } from "lucide-react";
import { ThinkingOrb, type OrbState } from "thinking-orbs";
import { PERSONAL_INFO } from "@/lib/content";
import { getDictionary } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";
import { MESSAGES, TOOLBOX, getMessage, resolveHref, type ChatFacts, type MessageRef } from "@/lib/chat/registry";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { Companion } from "@/components/chat/Companion";
import { Dock } from "@/components/chat/Dock";
import { PanelFigure } from "@/components/chat/PanelFigure";
import { Thread, type ThreadItem } from "@/components/chat/Thread";

const STORAGE_KEY = "portfolio-thread";
const COMPANION_KEY = "portfolio-companion";
const THINK_MS = 650;
const DESKTOP_QUERY = "(min-width: 1024px)";
// How long the page gets to slide away before the route actually changes (matches .panel-leave).
const LEAVE_MS = 240;

// Thread column width when a panel is open beside it.
const SIDE = "lg:w-[420px] xl:w-[480px]";
// Shared by the thread and the dock so their edges line up. Wide on the bare thread; the side
// column caps it when a panel is open. Layout inside responds to this container, not the viewport.
const COLUMN = "@container mx-auto w-full max-w-[960px] px-4 lg:px-6";
const SIDE_OFFSET = "lg:pl-[420px] xl:pl-[480px]";

const BRAND_STATES: OrbState[] = ["breathing", "working", "searching", "weaving", "composing", "connecting", "solving", "listening", "shaping"];
const BRAND_SHIFT_MS = 2000;

/** The logo mark: a thinking orb that moves to its next state every couple of seconds. */
function BrandOrb() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Under reduced motion the orb holds a still frame, so there is nothing to cycle.
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % BRAND_STATES.length), BRAND_SHIFT_MS);
    return () => window.clearInterval(id);
  }, []);

  return <ThinkingOrb size={20} state={BRAND_STATES[index]} theme="light" color="#a35b42" aria-hidden="true" className="shrink-0" />;
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

/**
 * The whole site frame: a chat thread with a docked composer, and the current route rendered as a
 * panel beside it (desktop) or over it (mobile). "/" is the bare thread; every other route is a panel.
 */
export function ChatShell({ facts, children }: { facts: ChatFacts; children: React.ReactNode }) {
  const dict = getDictionary();
  const pathname = usePathname();
  const router = useRouter();
  const panelOpen = pathname !== "/";

  // Which way the layout last moved, so the right entrance plays. Derived during render — an
  // effect would paint one frame in the final position first, which reads as a jump.
  const [wasOpen, setWasOpen] = useState(panelOpen);
  const [motion, setMotion] = useState<"none" | "open" | "close">("none");
  const [leaving, setLeaving] = useState(false);
  if (wasOpen !== panelOpen) {
    setWasOpen(panelOpen);
    setMotion(panelOpen ? "open" : "close");
    setLeaving(false);
  }

  const [items, setItems] = useState<ThreadItem[]>([]);
  // On unless the visitor has switched it off before.
  const [companion, setCompanion] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem(COMPANION_KEY) === "off") setCompanion(false);
    } catch {
      // No storage: keep the default.
    }
  }, []);

  function toggleCompanion() {
    setCompanion((on) => {
      try {
        localStorage.setItem(COMPANION_KEY, on ? "off" : "on");
      } catch {
        // The choice just won’t survive a reload.
      }
      return !on;
    });
  }
  const nextKey = useRef(0);
  // One answer at a time: a held-down shortcut or a double click must not stack exchanges.
  const pending = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLElement>(null);
  // Read inside timers, where the render-time value would be stale.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Restore the thread after a reload. Stored as refs only — copy is re-resolved from the dictionary.
  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]") as MessageRef[];
      const known = stored.filter((ref) => MESSAGES.some((m) => m.id === ref.id));
      if (known.length === 0) return;
      nextKey.current = known.length;
      setItems(known.map((ref, key) => ({ key, ref, status: "done" })));
    } catch {
      // Unreadable storage just means an empty thread.
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items.map((i) => i.ref)));
    } catch {
      // Storage can be unavailable (private mode); the thread still works for this visit.
    }
    const el = threadRef.current;
    if (el && items.length > 0) {
      el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  }, [items]);

  /** Slide the page away, then go home. Browser back skips this and simply swaps. */
  const closePanel = useCallback(() => {
    if (pathnameRef.current === "/") return;
    setLeaving(true);
    window.setTimeout(() => router.push("/"), prefersReducedMotion() ? 0 : LEAVE_MS);
  }, [router]);

  const send = useCallback(
    (ref: MessageRef) => {
      if (pending.current) return;
      pending.current = true;

      const def = getMessage(ref.id);
      const key = nextKey.current++;
      const href = resolveHref(def, facts);
      // On mobile the panel covers the thread, so from the bare thread we let the answer be read
      // first and offer an "Open" link instead of navigating away.
      const autoOpen = window.matchMedia(DESKTOP_QUERY).matches || pathnameRef.current !== "/";

      setItems((prev) => [...prev, { key, ref, status: "thinking", fresh: true }]);

      window.setTimeout(
        () => {
          pending.current = false;
          setItems((prev) => prev.map((i) => (i.key === key ? { ...i, status: "done" } : i)));
          if (def.action === "downloadCv") window.location.assign("/api/cv");
          if (href && autoOpen && href !== pathnameRef.current) router.push(href);
        },
        prefersReducedMotion() ? 0 : THINK_MS
      );
    },
    [facts, router]
  );

  useEffect(() => {
    function jumpMessage(direction: 1 | -1) {
      const el = threadRef.current;
      if (!el) return;
      const tops = Array.from(el.querySelectorAll<HTMLElement>("[data-msg]")).map(
        (m) => m.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop
      );
      const here = el.scrollTop;
      const target = direction === 1 ? tops.find((t) => t > here + 8) : [...tops].reverse().find((t) => t < here - 8);
      if (target !== undefined) el.scrollTo({ top: target, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.repeat) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (e.ctrlKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        jumpMessage(e.key === "ArrowDown" ? 1 : -1);
        return;
      }
      // e.code, because Alt changes e.key on macOS.
      if (e.altKey && !e.ctrlKey && !e.metaKey && /^Digit[1-9]$/.test(e.code)) {
        const id = TOOLBOX[Number(e.code.slice(5)) - 1];
        if (id) {
          e.preventDefault();
          send({ id });
        }
        return;
      }
      if (isTyping(e.target)) return;

      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape" && pathnameRef.current !== "/" && !document.querySelector('[role="dialog"]')) {
        closePanel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePanel, send]);

  function clearThread() {
    setItems([]);
    nextKey.current = 0;
  }

  const topLinks = [
    { href: PERSONAL_INFO.github, label: dict.ui.links.github, hint: dict.ui.links.github, icon: Github, external: true },
    { href: PERSONAL_INFO.linkedin, label: dict.ui.links.linkedin, hint: dict.ui.links.linkedin, icon: Linkedin, external: true },
    // Dropped on the narrowest screens to keep the bar uncrowded; "Can I get your CV?" covers it.
    { href: "/api/cv", label: dict.ui.links.cv, hint: dict.ui.links.cvHint, icon: FileDown, external: false, wide: true },
  ];

  const threadMotion = motion === "open" && panelOpen ? "thread-dock" : motion === "close" && !panelOpen ? "thread-undock" : "";
  const panelMotion = leaving ? "panel-leave" : motion === "open" ? "panel-enter" : "";

  // Plain left-clicks get the slide-out; modified clicks keep normal link behaviour.
  function onCloseClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!panelOpen || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    closePanel();
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-foreground/8 bg-background/90 px-4 backdrop-blur-sm lg:px-8">
        <Link href="/" onClick={onCloseClick} className="flex items-center gap-2.5" aria-label="Jeong — home">
          <BrandOrb />
          <span className="text-[13px] font-mono font-bold tracking-[0.25em] text-foreground">JEONG</span>
        </Link>

        <div className="flex items-center gap-3 lg:gap-4">
          {/* An action, not a destination — so it gets a border where the links beside it have none. */}
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearThread}
              aria-label={dict.ui.thread.clearHint}
              className="fade-in flex items-center gap-1.5 border border-foreground/15 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted transition-[color,border-color,background-color,transform] duration-150 ease-out hover:border-accent-primary/50 hover:bg-accent-primary/5 hover:text-accent-primary active:scale-[0.97]"
            >
              <Eraser size={14} strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden lg:inline">{dict.ui.thread.clear}</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleCompanion}
            aria-pressed={companion}
            aria-label={dict.ui.companion.toggle}
            className={`px-2 py-1.5 transition-[color,background-color,transform] duration-150 ease-out hover:bg-accent-primary/5 active:scale-[0.97] ${
              companion ? "text-accent-primary" : "text-muted/50 hover:text-accent-primary"
            }`}
          >
            <MousePointer2 size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>

          <nav aria-label={dict.ui.links.label} className="flex items-center gap-1 border-l border-foreground/10 pl-3 lg:pl-4">
            {topLinks.map(({ href, label, hint, icon: Icon, external, wide }) => (
              <a
                key={href}
                href={href}
                aria-label={hint}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`items-center gap-1.5 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted transition-[color,background-color,transform] duration-150 ease-out hover:bg-accent-primary/5 hover:text-accent-primary active:scale-[0.97] ${
                  wide ? "hidden sm:flex" : "flex"
                }`}
              >
                <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
                <span className="hidden lg:inline">{label}</span>
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="main" className="overflow-x-clip">
        <section
          ref={threadRef}
          aria-label={dict.ui.thread.assistant}
          className={`fixed bottom-0 top-14 overflow-y-auto ${threadMotion} ${
            panelOpen ? `left-0 hidden border-r border-foreground/8 lg:block ${SIDE}` : "inset-x-0"
          }`}
        >
          <div className={`${COLUMN} pb-60 pt-8`}>
            <Thread dict={dict} facts={facts} items={items} pathname={pathname} onSend={send} />
          </div>
        </section>

        <div
          data-dock
          className={`fixed bottom-0 left-0 z-30 border-t border-foreground/8 bg-background/95 backdrop-blur-sm ${threadMotion} ${
            panelOpen ? `right-0 lg:right-auto lg:border-r ${SIDE}` : "right-0"
          }`}
        >
          <div className={`${COLUMN} pb-4 pt-3`}>
            <Dock dict={dict} inputRef={inputRef} onSend={send} compact={panelOpen} pathname={pathname} />
          </div>
        </div>

        {/* The route. Lives in normal document flow so window scroll, sticky and anchors keep working. */}
        <section
          aria-label={dict.ui.panel.label}
          className={panelOpen ? `min-h-dvh pb-52 pt-14 lg:pb-0 ${SIDE_OFFSET} ${panelMotion}` : "hidden"}
        >
          <div className="sticky top-14 z-20 flex h-10 items-center justify-between border-b border-foreground/8 bg-background/90 px-6 backdrop-blur-sm md:px-12">
            <span className="text-[10px] font-mono tracking-[0.15em] text-muted/60">{pathname}</span>
            <Link
              href="/"
              onClick={onCloseClick}
              className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
            >
              {dict.ui.panel.close} ✕ <kbd className="ml-1 hidden font-mono text-muted/50 lg:inline">Esc</kbd>
            </Link>
          </div>
          {/* Keyed so each page fades in instead of snapping. Opacity only — this is content people read. */}
          <div key={pathname} className="fade-in">
            <PanelFigure pathname={pathname} />
            {children}
          </div>
        </section>
      </main>

      <AudioPlayer />
      {companion && (
        <Companion
          dict={dict}
          thinking={items.some((i) => i.status === "thinking")}
          quiet={pathname.startsWith("/blog/") || pathname === "/changelog"}
          onDismiss={toggleCompanion}
        />
      )}
    </>
  );
}
