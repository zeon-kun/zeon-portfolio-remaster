import { useSyncExternalStore } from "react";

export type Lang = "jp" | "en";

const listeners = new Set<() => void>();

const STORAGE_KEY = "portfolio-lang";

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "jp") return stored;
  return "en";
}

let currentLang: Lang = "en"; // hydration-safe default

export const langState = {
  get lang() {
    return currentLang;
  },

  toggle() {
    currentLang = currentLang === "jp" ? "en" : "jp";
    localStorage.setItem(STORAGE_KEY, currentLang);
    listeners.forEach((l) => l());
  },
};

// Initialize from localStorage after hydration
if (typeof window !== "undefined") {
  currentLang = getInitialLang();
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => currentLang,
    () => "en" as Lang, // server snapshot
  );
}
