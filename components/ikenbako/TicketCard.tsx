"use client";

import { ChevronUp } from "lucide-react";
import type { Ticket, TicketStatus } from "@/lib/supabase";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "OPEN",
  planned: "PLANNED",
  in_progress: "IN PROGRESS",
  done: "DONE",
  wont_do: "WON'T DO",
};

const STATUS_CLASS: Record<TicketStatus, string> = {
  open: "border-foreground/15 text-muted",
  planned: "border-accent-primary/30 text-accent-primary/80",
  in_progress: "border-accent-primary/50 text-accent-primary",
  done: "border-foreground/30 text-foreground/60 line-through",
  wont_do: "border-foreground/10 text-muted/40 line-through",
};

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface TicketCardProps {
  ticket: Ticket;
  hasVoted: boolean;
  onVote: () => void;
}

export function TicketCard({ ticket, hasVoted, onVote }: TicketCardProps) {
  return (
    <li className="border border-foreground/10 bg-background/40 backdrop-blur-sm p-4 md:p-5 flex items-start gap-4 hover:border-foreground/20 transition-colors duration-150">
      {/* Upvote button — left rail */}
      <button
        onClick={onVote}
        aria-label={hasVoted ? "Remove upvote" : "Upvote"}
        aria-pressed={hasVoted}
        className={`shrink-0 flex flex-col items-center justify-center min-w-[48px] py-2 px-2 border transition-all duration-150 ${
          hasVoted
            ? "border-accent-primary/60 bg-accent-primary/10 text-accent-primary"
            : "border-foreground/15 text-muted hover:text-foreground hover:border-foreground/30 hover:bg-foreground/5"
        }`}
      >
        <ChevronUp size={14} strokeWidth={hasVoted ? 2.5 : 1.8} />
        <span className="text-xs font-mono font-bold tabular-nums leading-tight mt-0.5">
          {ticket.upvote_count}
        </span>
      </button>

      {/* Body */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm md:text-[15px] font-bold text-foreground leading-snug break-words">
            {ticket.title}
          </h3>
          <span
            className={`shrink-0 text-[9px] font-mono font-bold uppercase tracking-[0.15em] px-2 py-0.5 border ${STATUS_CLASS[ticket.status]}`}
          >
            {STATUS_LABEL[ticket.status]}
          </span>
        </div>
        <p className="text-xs md:text-[13px] text-muted leading-relaxed whitespace-pre-wrap break-words">
          {ticket.description}
        </p>
        <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted/40">
          {relativeTime(ticket.created_at)}
        </p>
      </div>
    </li>
  );
}
