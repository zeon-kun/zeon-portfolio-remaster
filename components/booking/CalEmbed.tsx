"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Cal, { getCalApi } from "@calcom/embed-react";
import { ArrowUpRight } from "lucide-react";
import { CAL_LINK, CAL_URL } from "@/lib/content";

const NAMESPACE = "booking";

// If the embed script hasn't answered by now, assume it's blocked and fall back.
const LOAD_TIMEOUT = 8000;

/**
 * Cal.com is themed entirely through CSS custom properties. Mapping them onto
 * our tokens is the whole trick — without this the embed arrives as a white
 * SaaS card with a blue button, dropped into a warm clay page.
 */
const CAL_VARS: Record<string, string> = {
  "cal-brand": "#a35b42",
  "cal-brand-emphasis": "#8d4d38",
  "cal-brand-text": "#f5f0eb",

  "cal-bg": "#f5f0eb",
  "cal-bg-emphasis": "#e7e0d8",
  "cal-bg-subtle": "#efe9e2",
  "cal-bg-muted": "#f0ebe4",
  "cal-bg-inverted": "#1a1a1a",

  "cal-text": "#1a1a1a",
  "cal-text-emphasis": "#1a1a1a",
  "cal-text-subtle": "#6e6860",
  "cal-text-muted": "#8a8278",
  "cal-text-inverted": "#f5f0eb",

  "cal-border": "rgba(26, 26, 26, 0.12)",
  "cal-border-emphasis": "rgba(26, 26, 26, 0.28)",
  "cal-border-subtle": "rgba(26, 26, 26, 0.08)",
  "cal-border-muted": "rgba(26, 26, 26, 0.06)",
  "cal-border-booker": "rgba(26, 26, 26, 0.12)",
};

/** Ratecard hands the estimate over in the URL so the call starts with context. */
function useRatecardNotes(): string | undefined {
  const params = useSearchParams();
  const score = params.get("score");
  const fee = params.get("fee");
  const tier = params.get("tier");
  if (!score && !fee) return undefined;

  const lines = ["Coming from the ratecard estimator:"];
  if (score) lines.push(`Complexity score: ${score}/100${tier ? ` (${tier})` : ""}`);
  if (fee) lines.push(`Indicative range: ${fee}`);
  return lines.join("\n");
}

export function CalEmbed() {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const notes = useRatecardNotes();

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      if (!cancelled) setStatus((s) => (s === "loading" ? "failed" : s));
    }, LOAD_TIMEOUT);

    (async () => {
      try {
        const cal = await getCalApi({ namespace: NAMESPACE });
        if (cancelled) return;
        cal("ui", {
          theme: "light", // the site is light-only; Cal's "auto" would follow the OS
          layout: "month_view",
          hideEventTypeDetails: false,
          cssVarsPerTheme: { light: CAL_VARS, dark: CAL_VARS },
          styles: { body: { background: "transparent" } },
        });
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative border border-foreground/8 bg-background/40 backdrop-blur-sm">
      {/* Frame header — the same mono strip every panel on the site wears */}
      <div className="flex items-center justify-between border-b border-foreground/8 px-4 py-2.5">
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted/50">
          予約 / Availability
        </span>
        <a
          href={CAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-[0.15em] text-muted/50 hover:text-foreground transition-colors"
        >
          cal.com
          <ArrowUpRight size={10} />
        </a>
      </div>

      {status === "failed" ? (
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted">
            Embed unavailable
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-foreground/50">
            The calendar couldn&apos;t load — an extension or network policy may be blocking it.
            The booking page itself works fine.
          </p>
          <a
            href={CAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-accent-primary px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-80"
          >
            Open cal.com
            <ArrowUpRight size={13} />
          </a>
        </div>
      ) : (
        <div className="relative">
          {status === "loading" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
              <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted/40 animate-pulse">
                読み込み中 · Loading
              </span>
            </div>
          )}

          {/*
            Height is pinned rather than auto-sized: Cal's resize messages arrive
            after paint, and letting the frame collapse then jump is worse than
            reserving the space up front. `overflow-auto` keeps the month view
            scrollable inside the frame on short viewports.
          */}
          <Cal
            namespace={NAMESPACE}
            calLink={CAL_LINK}
            config={{
              layout: "month_view",
              theme: "light",
              ...(notes ? { notes } : {}),
            }}
            className="[&_iframe]:!bg-transparent"
            style={{
              width: "100%",
              height: "clamp(620px, 78vh, 860px)",
              overflow: "auto",
            }}
          />
        </div>
      )}

      {/* Corner bracket — same geometric detail as the project and coin cards */}
      <span className="pointer-events-none absolute bottom-1 right-1 h-2 w-2 border-b border-r border-foreground/8" />
    </div>
  );
}
