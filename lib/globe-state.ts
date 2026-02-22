// Shared globe phase state — accessed by PageLoader (writes) and GlobeBlueprint (reads)
// Uses a plain object so the globe's rAF loop can read without triggering React renders

import { useSyncExternalStore } from "react";

export type GlobePhase = "loading" | "transitioning" | "ready";
export type SlideId = "hero" | "about" | "experience" | "projects" | "ambient";

const listeners = new Set<() => void>();

export const globeState = {
  phase: "loading" as GlobePhase,
  transitionStart: 0, // performance.now() timestamp when transition begins
  transitionDuration: 1200, // ms for the morph
  activeSlide: "hero" as SlideId,
  lastUpdate: 0,

  /** Callback when a project planet is clicked (set by ProjectsSlide) */
  onProjectClick: null as ((projectIndex: number) => void) | null,

  /** Whether to show planetarium view on projects slide */
  showPlanetarium: true,

  /** Whether globe is visible (toggled via mobile navbar) */
  globeVisible: true,

  /** Update phase and notify React subscribers */
  setPhase(p: GlobePhase) {
    this.phase = p;
    listeners.forEach((l) => l());
  },

  /** Update active slide (globe reads this in rAF loop for position/size) */
  setActiveSlide(id: SlideId) {
    this.activeSlide = id;
    listeners.forEach((l) => l());
  },

  setShowPlanetarium(value: boolean) {
    this.showPlanetarium = value;
    this.lastUpdate = Date.now(); // Trigger update
  },

  toggleGlobeVisible() {
    this.globeVisible = !this.globeVisible;
    listeners.forEach((l) => l());
  },
};

/** React hook — re-renders when globe visibility changes */
export function useGlobeVisible(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => globeState.globeVisible,
    () => true // server snapshot
  );
}

/** React hook — re-renders when phase changes */
export function useGlobePhase(): GlobePhase {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => globeState.phase,
    () => "loading" as GlobePhase // server snapshot
  );
}
