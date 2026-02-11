"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, WifiOff } from "lucide-react";
import { audioState } from "@/lib/audio";

const STREAM_URL = "https://streams.ilovemusic.de/iloveradio17.mp3";
const TRACK_LABEL = "LOFI STREAM";

export function AudioPlayer() {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [offline, setOffline] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.preload = "none";
    audio.volume = 0.5;
    audioRef.current = audio;

    audio.addEventListener("error", () => {
      setOffline(true);
      setPlaying(false);
      audioState.isPlaying = false;
    });

    return () => {
      audio.pause();
      audio.src = "";
      audioState.isPlaying = false;
      audioState.analyser = null;
      audioState.dataArray = null;
      ctxRef.current?.close();
    };
  }, []);

  const initAudioContext = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || ctxRef.current) return;

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    ctxRef.current = ctx;
    sourceRef.current = source;
    audioState.analyser = analyser;
    audioState.dataArray = new Uint8Array(analyser.frequencyBinCount);
  }, []);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      audioState.isPlaying = false;
      return;
    }

    // Initialize AudioContext on first user interaction
    if (!ctxRef.current) {
      initAudioContext();
    }

    // Resume suspended context (browser autoplay policy)
    if (ctxRef.current?.state === "suspended") {
      await ctxRef.current.resume();
    }

    // Set source and play
    if (!audio.src || offline) {
      audio.src = STREAM_URL;
      setOffline(false);
    }

    try {
      await audio.play();
      setPlaying(true);
      audioState.isPlaying = true;
    } catch {
      setOffline(true);
      audioState.isPlaying = false;
    }
  }, [playing, offline, initAudioContext]);

  const handleVolume = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setVolume(v);
      if (audioRef.current) audioRef.current.volume = v;
      if (v === 0) setMuted(true);
      else if (muted) setMuted(false);
    },
    [muted]
  );

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    if (muted) {
      audioRef.current.volume = volume || 0.5;
      setMuted(false);
    } else {
      audioRef.current.volume = 0;
      setMuted(true);
    }
  }, [muted, volume]);

  // Keyboard: space/enter to toggle play when player is focused
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
      }
    },
    [togglePlay]
  );

  return (
    <div
      className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-2 flex items-center gap-3
        border border-foreground/10 bg-background/90 backdrop-blur-sm px-3 py-2
        select-none"
      role="region"
      aria-label="Audio player"
      onKeyDown={handleKeyDown}
    >
      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        aria-label={offline ? "Stream offline" : playing ? "Pause" : "Play"}
        className="flex items-center justify-center w-7 h-7 transition-colors
          focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
      >
        {offline ? (
          <WifiOff size={14} className="text-muted" />
        ) : playing ? (
          <Pause size={14} className="text-accent-primary" />
        ) : (
          <Play size={14} className="text-foreground/60" />
        )}
      </button>

      {/* Track label */}
      <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/40 hidden sm:block">
        {offline ? "OFFLINE" : TRACK_LABEL}
      </span>

      {/* Volume — hidden on mobile to save space */}
      <button
        onClick={toggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="hidden md:flex items-center justify-center w-5 h-5
          focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
      >
        {muted || volume === 0 ? (
          <VolumeX size={12} className="text-foreground/40" />
        ) : (
          <Volume2 size={12} className="text-foreground/40" />
        )}
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={muted ? 0 : volume}
        onChange={handleVolume}
        aria-label="Volume"
        className="hidden md:block w-14 h-[2px] appearance-none bg-foreground/15 cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2
          [&::-webkit-slider-thumb]:bg-accent-primary [&::-webkit-slider-thumb]:border-0
          [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:h-2
          [&::-moz-range-thumb]:bg-accent-primary [&::-moz-range-thumb]:border-0
          focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
      />
    </div>
  );
}
