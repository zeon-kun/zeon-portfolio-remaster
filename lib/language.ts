import { useSyncExternalStore } from "react";

export type Lang = "jp" | "en";

const listeners = new Set<() => void>();

const STORAGE_KEY = "portfolio-lang";

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "jp";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "jp") return stored;
  return "jp";
}

let currentLang: Lang = "jp"; // hydration-safe default

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
    () => "jp" as Lang, // server snapshot
  );
}
