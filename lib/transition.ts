// Shared route transition state — plain object (no React re-renders)
// Same pattern as globe-state.ts

import { useSyncExternalStore } from "react";

export type TransitionPhase = "idle" | "exiting" | "entering";

const listeners = new Set<() => void>();

export const transitionState = {
  phase: "idle" as TransitionPhase,
  targetHref: "",

  setPhase(p: TransitionPhase) {
    this.phase = p;
    listeners.forEach((l) => l());
  },
};

export function useTransitionPhase(): TransitionPhase {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => transitionState.phase,
    () => "idle" as TransitionPhase
  );
}
