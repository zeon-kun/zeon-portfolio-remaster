"use client";

import { useState, useEffect } from "react";
import { Calculator } from "lucide-react";
import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/layout/TransitionLink";
import { useLang } from "@/lib/language";

export function RatecardButton({ loaderVisible }: { loaderVisible?: boolean }) {
  const lang = useLang();
  const pathname = usePathname();
  const [scrollHidden, setScrollHidden] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    function onScroll() {
      if (window.innerWidth >= 768) return;
      setScrollHidden(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setScrollHidden(false), 1000);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("portfolio:scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("portfolio:scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (pathname?.startsWith("/ratecard")) return null;

  return (
    <TransitionLink
      href="/ratecard"
      aria-label={lang === "jp" ? "料金ページへ" : "View Ratecard"}
      className={`group fixed right-0 top-1/2 -translate-y-1/2 z-50
        flex flex-col items-center gap-2.5
        bg-accent-primary text-background
        px-2.5 py-5
        shadow-[0_4px_24px_-6px_rgba(163,91,66,0.45)]
        select-none no-underline
        transition-all duration-700 ease-out
        hover:px-3 hover:shadow-[0_6px_28px_-4px_rgba(163,91,66,0.6)]
        focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-2
        ${loaderVisible
          ? "opacity-0 translate-x-4 -translate-y-1/2"
          : scrollHidden
          ? "opacity-0 translate-x-4 -translate-y-1/2 md:opacity-100 md:translate-x-0 md:-translate-y-1/2"
          : "opacity-100 translate-x-0 -translate-y-1/2"}`}
    >
      <Calculator size={16} strokeWidth={2.25} />

      <span
        className={`text-[10px] uppercase tracking-[0.3em] font-bold
          ${lang === "jp" ? "font-jp" : "font-mono"}`}
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        {lang === "jp" ? "料金" : "Ratecard"}
      </span>

      <span
        aria-hidden="true"
        className="block w-1.5 h-1.5 bg-background/70 group-hover:bg-background transition-colors"
      />
    </TransitionLink>
  );
}
