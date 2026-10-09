"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { audioState, getFrequencyBands } from "@/lib/audio";
import { getDictionary } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";

// Add files here to make it a playlist; "next" enables itself once there is more than one.
const TRACKS = [{ src: "/audio/lofi.mp3", title: "Lofi", label: "LOFI" }];

// The island is one element that changes size. Fixed numbers so the change can transition.
const PILL_HEIGHT = 30;
const PILL_RESTING = 82;
const PILL_PLAYING = 132;
const PILL_PHONE = 58; // play button + equaliser only — the top bar has no room for the label there
const CARD_HEIGHT = 136;
const CARD_MAX_WIDTH = 320;
const SCREEN_GUTTER = 16;
const PHONE_LEFT = 116; // where the pill sits after the logo below lg; keep in sync with the class
const HOVER_CLOSE_MS = 700;

const sliderClass =
  "h-[3px] cursor-pointer appearance-none bg-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-primary [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-accent-primary [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent-primary";

const iconButton =
  "flex items-center justify-center transition-[color,transform] duration-150 ease-out hover:text-accent-primary active:scale-[0.92] disabled:opacity-25 disabled:hover:text-current";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** Three bars driven by the live audio; flat when paused. */
function Equaliser({ playing }: { playing: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const bars = ref.current ? Array.from(ref.current.children as HTMLCollectionOf<HTMLElement>) : [];
    const set = (values: number[]) => bars.forEach((bar, i) => (bar.style.transform = `scaleY(${values[i]})`));

    if (!playing) return set([0.25, 0.25, 0.25]);
    if (prefersReducedMotion()) return set([0.55, 0.9, 0.4]);

    let raf = 0;
    const tick = () => {
      const { bass, mid, treble } = getFrequencyBands();
      set([bass, mid, treble].map((v) => Math.max(0.2, Math.min(1, v * 1.6))));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return (
    <span ref={ref} aria-hidden="true" className="flex h-3 shrink-0 items-end gap-[2px]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-full w-[2.5px] origin-bottom bg-accent-primary transition-transform duration-100 ease-out" />
      ))}
    </span>
  );
}

/**
 * The audio "island": a plate in the top bar that unfolds into the full controls. It is a single
 * element morphing between pill and card, with the two sets of contents cross-fading inside it.
 */
export function AudioPlayer() {
  const t = getDictionary().ui.audio;
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState({ width: 1280, desktop: true });

  const rootRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const hoverTimer = useRef(0);
  const single = TRACKS.length === 1;
  const track = TRACKS[index];

  useEffect(() => {
    const update = () => setScreen({ width: window.innerWidth, desktop: window.matchMedia("(min-width: 1024px)").matches });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // One audio element for the life of the page.
  useEffect(() => {
    const audio = new Audio(TRACKS[0].src);
    audio.preload = "metadata";
    audio.volume = 0.5;
    audio.loop = TRACKS.length === 1;
    audioRef.current = audio;

    const onTime = () => setTime(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnded = () => setIndex((i) => (i + 1) % TRACKS.length);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    // Some servers only reveal the length once playback starts.
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
      audioState.isPlaying = false;
      audioState.analyser = null;
      audioState.dataArray = null;
      ctxRef.current?.close();
    };
  }, []);

  // Switching track keeps the play state.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || audio.src.endsWith(TRACKS[index].src)) return;
    audio.src = TRACKS[index].src;
    setTime(0);
    if (audioState.isPlaying) audio.play().catch(() => {});
  }, [index]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      audioState.isPlaying = false;
      return;
    }

    // The analyser (which the orb and the equaliser read) can only be created after a user gesture.
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaElementSource(audio).connect(analyser);
      analyser.connect(ctx.destination);
      ctxRef.current = ctx;
      audioState.analyser = analyser;
      audioState.dataArray = new Uint8Array(analyser.frequencyBinCount);
    }
    if (ctxRef.current.state === "suspended") await ctxRef.current.resume();

    try {
      await audio.play();
      setPlaying(true);
      audioState.isPlaying = true;
    } catch (err) {
      console.error("Audio playback failed:", err);
    }
  }, [playing]);

  /** Back to the start of this track, or to the previous one if it has barely begun. */
  function previous() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.currentTime > 3 || single) {
      audio.currentTime = 0;
      setTime(0);
    } else {
      setIndex((i) => (i - 1 + TRACKS.length) % TRACKS.length);
    }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = value;
    setTime(value);
  }

  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(e.target.value);
    setVolume(value);
    setMuted(value === 0);
    if (audioRef.current) audioRef.current.volume = value;
  }

  function toggleMute() {
    if (!audioRef.current) return;
    audioRef.current.volume = muted ? volume || 0.5 : 0;
    setMuted(!muted);
  }

  // Dismiss: click outside, Escape (before the shell uses it to close the panel), pointer wandering off.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const cardWidth = Math.min(CARD_MAX_WIDTH, screen.width - SCREEN_GUTTER * 2);
  const width = open ? cardWidth : !screen.desktop ? PILL_PHONE : playing ? PILL_PLAYING : PILL_RESTING;
  // On desktop it is centred on the bar and grows both ways. On phones it sits after the logo and
  // slides left as it opens so the card ends up within the screen gutters.
  const shift = screen.desktop ? "-50%" : open ? `${SCREEN_GUTTER - PHONE_LEFT}px` : "0px";

  return (
    <div
      ref={rootRef}
      className="fixed left-[116px] top-[13px] z-50 lg:left-1/2"
      onPointerEnter={() => window.clearTimeout(hoverTimer.current)}
      onPointerLeave={(e) => {
        if (open && e.pointerType === "mouse") hoverTimer.current = window.setTimeout(() => setOpen(false), HOVER_CLOSE_MS);
      }}
    >
      <div
        role="region"
        aria-label={t.label}
        data-companion="audio"
        style={{ width, height: open ? CARD_HEIGHT : PILL_HEIGHT, transform: `translateX(${shift})` }}
        className={`absolute left-0 top-0 overflow-hidden border bg-background text-foreground transition-[width,height,transform,box-shadow,border-color] ease-(--ease-drawer) select-none ${
          open
            ? "border-foreground/25 shadow-[0_10px_28px_-12px_rgba(26,26,26,0.35)] duration-[350ms]"
            : "border-foreground/15 duration-[250ms]"
        }`}
      >
        {/* ── Pill contents ── */}
        <div
          inert={open}
          className={`absolute left-0 top-0 flex items-center whitespace-nowrap transition-[opacity,filter] ease-out ${
            open ? "opacity-0 blur-[3px] duration-[120ms]" : "opacity-100 blur-0 delay-[120ms] duration-200"
          }`}
          style={{ height: PILL_HEIGHT - 2 }}
        >
          <button type="button" onClick={togglePlay} aria-label={playing ? t.pause : t.play} className={`${iconButton} h-full w-8`}>
            {playing ? <Pause size={12} className="text-accent-primary" /> : <Play size={12} className="text-accent-primary" />}
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-label={t.expand}
            className="flex h-full items-center gap-2 pr-3 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/70 transition-colors duration-150 hover:text-accent-primary"
          >
            {/* On phones the equaliser is always there: it is the only handle for opening the card. */}
            <span className={playing ? "" : "lg:hidden"}>
              <Equaliser playing={playing} />
            </span>
            <span className="hidden lg:inline">{track.label}</span>
            {playing && <span className="hidden tracking-normal text-muted/70 lg:inline">{formatTime(time)}</span>}
          </button>
        </div>

        {/* ── Card contents ── */}
        <div
          inert={!open}
          style={{ width: cardWidth - 2, height: CARD_HEIGHT - 2 }}
          className={`absolute left-0 top-0 flex flex-col justify-between px-4 py-3.5 transition-[opacity,filter] ease-out ${
            open ? "opacity-100 blur-0 delay-[100ms] duration-200" : "opacity-0 blur-[3px] duration-[100ms]"
          }`}
        >
          <div className="flex items-center gap-3">
            <Equaliser playing={playing} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-foreground">{track.title}</p>
              {!single && (
                <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-muted/60">
                  {index + 1} / {TRACKS.length}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[9px] text-muted/70">
            <span className="w-7">{formatTime(time)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(time, duration || 0)}
              onChange={seek}
              aria-label={t.seek}
              className={`${sliderClass} min-w-0 flex-1`}
            />
            <span className="w-7 text-right">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={previous} aria-label={t.previous} className={`${iconButton} size-7`}>
                <SkipBack size={15} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? t.pause : t.play}
                className="flex size-8 items-center justify-center bg-foreground text-background transition-[background-color,transform] duration-150 ease-out hover:bg-accent-primary active:scale-[0.94]"
              >
                {playing ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % TRACKS.length)}
                disabled={single}
                aria-label={t.next}
                className={`${iconButton} size-7`}
              >
                <SkipForward size={15} strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={toggleMute} aria-label={muted ? t.unmute : t.mute} className={`${iconButton} size-6 text-muted`}>
                {muted || volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={changeVolume}
                aria-label={t.volume}
                className={`${sliderClass} w-16`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
