"use client";

import { useEffect } from "react";
import { ArchGrid } from "@/components/hero/ArchGrid";
import { MouseTracker } from "@/components/hero/MouseTracker";
import { BlueprintElements } from "@/components/geometric/GlobeBlueprint";
import { Navbar } from "@/components/nav/Navbar";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { globeState, useGlobePhase } from "@/lib/globe-state";
import { useTransitionPhase } from "@/lib/transition";

export function PageOverlays({ children }: { children: React.ReactNode }) {
  const globePhase = useGlobePhase();
  const transitionPhase = useTransitionPhase();
  const isHidden = globePhase !== "ready" || transitionPhase === "exiting";

  useEffect(() => {
    globeState.activeSlide = "ambient";
  }, []);

  return (
    <>
      <ArchGrid />
      <MouseTracker />
      <BlueprintElements />
      <Navbar mode="routes" loaderVisible={isHidden} />
      <AudioPlayer loaderVisible={isHidden} />

      {/* Content wrapper — mirrors SlideContainer's #main opacity gate */}
      <div
        className={`relative z-10 transition-all duration-500 ease-out ${isHidden ? "opacity-0 blur-sm" : "opacity-100 blur-0"}`}
      >
        {children}
      </div>
    </>
  );
}
