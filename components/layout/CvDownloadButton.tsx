"use client";

import { useState, useEffect, useCallback } from "react";
import { Download } from "lucide-react";

const CV_HREF = "/api/cv";
const LABEL = "CV";

export function CvDownloadButton({
  loaderVisible,
  onDownload,
}: {
  loaderVisible?: boolean;
  onDownload?: () => void;
}) {
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

  const handleClick = useCallback(() => {
    onDownload?.();
  }, [onDownload]);

  return (
    <a
      href={CV_HREF}
      download
      onClick={handleClick}
      aria-label="Download CV as PDF"
      className={`fixed bottom-20 left-4 md:bottom-8 md:left-8 z-50 flex items-center gap-3
        border border-foreground/10 bg-background/90 backdrop-blur-sm px-3 py-2
        select-none no-underline transition-all duration-700 ease-out
        focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2
        ${loaderVisible ? "opacity-0 translate-y-4" : scrollHidden ? "opacity-0 translate-y-4 md:opacity-100 md:translate-y-0" : "opacity-100 translate-y-0"}`}
    >
      <span className="flex items-center justify-center w-7 h-7">
        <Download size={14} className="text-accent-primary" />
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/40">
        {LABEL}
      </span>
    </a>
  );
}
