"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

interface SubmitFormProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TITLE_MIN = 3;
const TITLE_MAX = 120;
const DESC_MIN = 10;
const DESC_MAX = 2000;

export function SubmitForm({ userId, onClose, onSuccess }: SubmitFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleValid = title.trim().length >= TITLE_MIN && title.trim().length <= TITLE_MAX;
  const descValid = description.trim().length >= DESC_MIN && description.trim().length <= DESC_MAX;
  const canSubmit = titleValid && descValid && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await getSupabase()
      .from("tickets")
      .insert({
        title: title.trim(),
        description: description.trim(),
        created_by: userId,
      });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSuccess();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg border border-foreground/10 bg-background p-6 md:p-8 space-y-5"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 text-muted hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>

        <header className="space-y-1">
          <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted/50">New Ticket</p>
          <h2 className="text-lg font-black tracking-wider text-foreground">意見箱 / Submit</h2>
        </header>

        {/* Title */}
        <label className="block space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted">
            Title <span className="text-accent-primary/60">*</span>
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="Short summary of your request"
            className="w-full px-3 py-2 text-sm bg-background border border-foreground/15 focus:border-accent-primary/50 focus:outline-none transition-colors"
            required
          />
          <span className="block text-[9px] font-mono text-muted/40 text-right tabular-nums">
            {title.trim().length}/{TITLE_MAX}
          </span>
        </label>

        {/* Description */}
        <label className="block space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted">
            Description <span className="text-accent-primary/60">*</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={DESC_MAX}
            rows={6}
            placeholder="What's the pain point? What would 'good' look like? Include context, examples, or screenshots links."
            className="w-full px-3 py-2 text-sm bg-background border border-foreground/15 focus:border-accent-primary/50 focus:outline-none transition-colors resize-y leading-relaxed"
            required
          />
          <span className="block text-[9px] font-mono text-muted/40 text-right tabular-nums">
            {description.trim().length}/{DESC_MAX}
          </span>
        </label>

        {error && (
          <p className="text-xs font-mono text-accent-primary/80 border border-accent-primary/30 bg-accent-primary/5 px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider border border-foreground/15 text-muted hover:text-foreground hover:border-foreground/30 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider bg-accent-primary text-background hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
          >
            <Send size={11} />
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
