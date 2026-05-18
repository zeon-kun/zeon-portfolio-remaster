"use client";

import { useState } from "react";
import type { Lang } from "@/lib/ratecard";

interface PasteStepProps {
  initialText: string;
  onContinue: (text: string) => void;
  lang: Lang;
}

const MAX_LEN = 3000;

export function PasteStep({ initialText, onContinue, lang }: PasteStepProps) {
  const [text, setText] = useState(initialText);

  const isJp = lang === "jp";

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-foreground/10 bg-background/40 backdrop-blur-sm p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted mb-1">
              {isJp ? "依頼内容" : "Project Brief"}
            </p>
            <p className="text-sm text-foreground/70">
              {isJp
                ? "クライアントの依頼文を貼り付けてください。キーワードから自動で初期値を設定します。"
                : "Paste the client's project request. Keywords are used to pre-fill the interview."}
            </p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
          rows={10}
          placeholder={
            isJp
              ? "依頼文・募集要項・プロジェクト概要を貼り付け…"
              : "Paste the job posting, project brief, or requirements…"
          }
          className="w-full px-3 py-2 text-sm bg-background border border-foreground/15 focus:border-accent-primary/50 focus:outline-none transition-colors resize-none font-mono text-foreground/80 placeholder:text-foreground/25"
        />

        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-muted/50 tabular-nums">
            {text.length} / {MAX_LEN}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onContinue("")}
              className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted hover:text-foreground transition-colors px-2 py-1"
            >
              {isJp ? "スキップ — 手動で回答" : "Skip — answer manually"}
            </button>
            <button
              type="button"
              onClick={() => onContinue(text)}
              disabled={text.trim().length === 0}
              className="bg-accent-primary text-background text-[10px] font-mono font-bold uppercase tracking-[0.15em] px-5 py-2 transition-opacity disabled:opacity-30"
            >
              {isJp ? "続ける →" : "Continue →"}
            </button>
          </div>
        </div>
      </div>

      <p className="text-[9px] font-mono text-muted/40 tracking-[0.1em]">
        {isJp
          ? "空欄のままスキップすると、全次元がデフォルト（標準）で始まります。"
          : "Skipping without text starts the interview with all dimensions at default (Standard)."}
      </p>
    </div>
  );
}
