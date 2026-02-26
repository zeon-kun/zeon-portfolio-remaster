"use client";

import { useState } from "react";
import { Download, Maximize2, X, Mail } from "lucide-react";

const RECEIPT_MAILTO = [
  "mailto:rafif.zeon@gmail.com",
  "?subject=Payment%20Receipt%20%E2%80%94%20QRIS",
  "&body=Hi%20Rafif%2C%0A%0AHere%20is%20my%20payment%20receipt%20for%20the%20QRIS%20transfer.%0A%0A%5BAttach%20your%20screenshot%20here%5D%0A%0ARegards%2C%0A%5BYour%20name%5D",
].join("");

export function QrisCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* ── Card ── */}
      <div className="border border-foreground/10 bg-background/40 backdrop-blur-sm p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted/50 mb-1">Method 01</p>
            <h2 className="text-base font-black tracking-wider text-foreground">QRIS</h2>
          </div>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="text-accent-primary/30 shrink-0"
          >
            <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        {/* QR image */}
        <div className="flex justify-center">
          <div className="relative border-2 border-dashed border-foreground/15 aspect-square w-full max-w-[200px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/qris.png" alt="QRIS payment code" className="w-full h-full object-contain" />
            <span className="absolute top-1 left-1 w-2 h-2 border-t border-l border-foreground/20" />
            <span className="absolute top-1 right-1 w-2 h-2 border-t border-r border-foreground/20" />
            <span className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-foreground/20" />
            <span className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-foreground/20" />
          </div>
        </div>

        {/* Label */}
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-wider text-foreground/70">Scan to pay</p>
          <p className="text-[10px] font-mono text-muted/50 uppercase tracking-wider">Indonesia Only</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setExpanded(true)}
            aria-label="Expand QR code for scanning"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border border-foreground/15 text-muted hover:text-foreground hover:border-foreground/30 hover:bg-foreground/5 transition-all duration-150"
          >
            <Maximize2 size={11} />
            ZOOM
          </button>

          <a
            href="/qris.png"
            download="QRIS-Jeong.png"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border border-foreground/15 text-muted hover:text-foreground hover:border-foreground/30 hover:bg-foreground/5 transition-all duration-150"
          >
            <Download size={11} />
            SAVE QR
          </a>

          <a
            href={RECEIPT_MAILTO}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border border-accent-primary/30 text-accent-primary/70 hover:text-accent-primary hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-all duration-150"
          >
            <Mail size={11} />
            SEND RECEIPT
          </a>
        </div>
      </div>

      {/* ── Zoom modal ── */}
      {expanded && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md"
          onClick={() => setExpanded(false)}
        >
          <div className="relative flex flex-col items-center gap-5 p-8" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button
              onClick={() => setExpanded(false)}
              aria-label="Close"
              className="absolute -top-1 -right-1 p-2 text-muted hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>

            <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted/50">支払い / Scan to Pay</p>

            {/* Large QR */}
            <div className="relative border-2 border-dashed border-foreground/20 w-64 h-64 md:w-80 md:h-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/qris.png" alt="QRIS payment code — enlarged" className="w-full h-full object-contain" />
              <span className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-foreground/30" />
              <span className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-foreground/30" />
              <span className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-foreground/30" />
              <span className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-foreground/30" />
            </div>

            {/* Modal actions */}
            <div className="flex items-center gap-3">
              <a
                href="/qris.png"
                download="QRIS-Jeong.png"
                className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider border border-foreground/20 text-muted hover:text-foreground hover:border-foreground/40 hover:bg-foreground/5 transition-all duration-150"
              >
                <Download size={11} />
                DOWNLOAD
              </a>
              <a
                href={RECEIPT_MAILTO}
                className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider border border-accent-primary/30 text-accent-primary/70 hover:text-accent-primary hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-all duration-150"
              >
                <Mail size={11} />
                SEND RECEIPT
              </a>
            </div>

            <p className="text-[10px] font-mono text-muted/35 uppercase tracking-wider text-center">
              Tap outside to close
            </p>
          </div>
        </div>
      )}
    </>
  );
}
