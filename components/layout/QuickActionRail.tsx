"use client";

import { useState, useEffect } from "react";
import { Calculator, CalendarDays, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/layout/TransitionLink";
import { useLang } from "@/lib/language";

type QuickAction = {
  href: string;
  icon: LucideIcon;
  jp: string;
  en: string;
  /** aria-label — the tab itself only carries a vertical word. */
  labelJp: string;
  labelEn: string;
};

// Ordered the way the funnel runs: size the work, then book the call.
const ACTIONS: QuickAction[] = [
  {
    href: "/ratecard",
    icon: Calculator,
    jp: "料金",
    en: "Ratecard",
    labelJp: "料金ページへ",
    labelEn: "View Ratecard",
  },
  {
    href: "/booking",
    icon: CalendarDays,
    jp: "予約",
    en: "Booking",
    labelJp: "予約ページへ",
    labelEn: "Book a call",
  },
];

/**
 * Right-edge vertical tabs. Rendered as one rail rather than independent fixed
 * elements so the stack stays centred when a tab hides itself on its own route.
 */
export function QuickActionRail({ loaderVisible }: { loaderVisible?: boolean }) {
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

  const isJp = lang === "jp";
  const visible = ACTIONS.filter((a) => !pathname?.startsWith(a.href));
  if (visible.length === 0) return null;

  return (
    <div
      className={`fixed right-0 top-1/2 z-50 flex flex-col items-end gap-2
        transition-all duration-700 ease-out
        ${loaderVisible
          ? "opacity-0 translate-x-4 -translate-y-1/2"
          : scrollHidden
          ? "opacity-0 translate-x-4 -translate-y-1/2 md:opacity-100 md:translate-x-0 md:-translate-y-1/2"
          : "opacity-100 translate-x-0 -translate-y-1/2"}`}
    >
      {visible.map(({ href, icon: Icon, jp, en, labelJp, labelEn }) => (
        <TransitionLink
          key={href}
          href={href}
          aria-label={isJp ? labelJp : labelEn}
          className="group flex flex-col items-center gap-2.5
            bg-accent-primary text-background
            px-2.5 py-5
            shadow-[0_4px_24px_-6px_rgba(163,91,66,0.45)]
            select-none no-underline
            transition-all duration-300 ease-out
            hover:px-3 hover:shadow-[0_6px_28px_-4px_rgba(163,91,66,0.6)]
            focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-2"
        >
          <Icon size={16} strokeWidth={2.25} />

          <span
            className={`text-[10px] uppercase tracking-[0.3em] font-bold
              ${isJp ? "font-jp" : "font-mono"}`}
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {isJp ? jp : en}
          </span>

          <span
            aria-hidden="true"
            className="block w-1.5 h-1.5 bg-background/70 group-hover:bg-background transition-colors"
          />
        </TransitionLink>
      ))}
    </div>
  );
}
