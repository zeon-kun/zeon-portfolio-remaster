"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

const ETH_ADDRESS = "0x821E2294f4413f88a458299914db394Ea3471C64";

function formatAddress(addr: string): string {
  // Split into 4-char chunks separated by thin space
  return addr.replace(/(.{4})/g, "$1\u2009").trim();
}

export function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-3">
      {/* Address display */}
      <div className="font-mono text-[11px] tracking-wide text-foreground/70 break-all leading-relaxed">
        {formatAddress(address)}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          aria-label={copied ? "Copied!" : "Copy address"}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border transition-all duration-150 ${
            copied
              ? "border-accent-primary/40 text-accent-primary bg-accent-primary/5"
              : "border-foreground/15 text-muted hover:text-foreground hover:border-foreground/30 hover:bg-foreground/5"
          }`}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "COPIED" : "COPY"}
        </button>

        <a
          href={`https://etherscan.io/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border border-foreground/15 text-muted hover:text-foreground hover:border-foreground/30 hover:bg-foreground/5 transition-all duration-150"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          ETHERSCAN
        </a>
      </div>
    </div>
  );
}
