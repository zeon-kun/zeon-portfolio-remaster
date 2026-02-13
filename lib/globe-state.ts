// Shared globe phase state — accessed by PageLoader (writes) and GlobeBlueprint (reads)
// Uses a plain object so the globe's rAF loop can read without triggering React renders

import { useSyncExternalStore } from "react";

export type GlobePhase = "loading" | "transitioning" | "ready";

const listeners = new Set<() => void>();

export const globeState = {
  phase: "loading" as GlobePhase,
  transitionStart: 0, // performance.now() timestamp when transition begins
  transitionDuration: 1200, // ms for the morph

  /** Update phase and notify React subscribers */
  setPhase(p: GlobePhase) {
    this.phase = p;
    listeners.forEach((l) => l());
  },
};

/** React hook — re-renders when phase changes */
export function useGlobePhase(): GlobePhase {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => globeState.phase,
    () => "loading" as GlobePhase, // server snapshot
  );
}
