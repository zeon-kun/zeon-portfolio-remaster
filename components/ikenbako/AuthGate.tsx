"use client";

import { useEffect, useRef, useState } from "react";
import { X, Mail, AlertTriangle, ArrowLeft } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type Stage = "email" | "code";

interface AuthGateProps {
  intent: "submit" | "vote";
  onClose: () => void;
  onSuccess: () => void;
}

const RESEND_COOLDOWN_SECONDS = 30;

export function AuthGate({ intent, onClose, onSuccess }: AuthGateProps) {
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // Auto-focus code input when entering OTP stage
  useEffect(() => {
    if (stage === "code") {
      const t = setTimeout(() => codeInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [stage]);

  async function sendCode(targetEmail: string, isResend: boolean) {
    setBusy(true);
    setError(null);
    setInfo(null);
    const { error: err } = await getSupabase().auth.signInWithOtp({
      email: targetEmail,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setResendIn(RESEND_COOLDOWN_SECONDS);
    if (isResend) setInfo("Code resent — check your spam folder.");
    setStage("code");
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    await sendCode(trimmed, false);
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const token = code.replace(/\s+/g, "");
    if (token.length < 6) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await getSupabase().auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    });
    setBusy(false);
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
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md border border-foreground/10 bg-background p-6 md:p-8 space-y-5"
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
          <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted/50">
            Sign In to {intent === "submit" ? "Submit" : "Vote"}
          </p>
          <h2 className="text-lg font-black tracking-wider text-foreground">
            {stage === "email" ? "認証 / Verify" : "コード / Code"}
          </h2>
        </header>

        {/* Spam-folder warning — always visible because email reputation is flagged */}
        <div className="flex items-start gap-2.5 border border-accent-primary/30 bg-accent-primary/5 px-3 py-2.5">
          <AlertTriangle size={13} className="text-accent-primary/80 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-accent-primary/90">
            <span className="font-bold">Heads up:</span> my sender domain is currently flagged by
            Gmail&apos;s reputation filter, so the code email almost always lands in{" "}
            <span className="font-bold uppercase tracking-wider">Spam / Junk</span>. Please check
            that folder before resending. Apologies — actively working on this.
          </p>
        </div>

        {stage === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted">
                Email
              </span>
              <div className="flex items-center gap-2 border border-foreground/15 focus-within:border-accent-primary/50 transition-colors px-3">
                <Mail size={13} className="text-muted/60 shrink-0" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 py-2 text-sm bg-transparent focus:outline-none"
                  required
                />
              </div>
            </label>

            {error && (
              <p className="text-xs font-mono text-accent-primary/80 border border-accent-primary/30 bg-accent-primary/5 px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full px-4 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider bg-accent-primary text-background hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
            >
              {busy ? "Sending code…" : "Send 6-digit code"}
            </button>

            <p className="text-[10px] font-mono text-muted/50 leading-relaxed text-center">
              No password. We&apos;ll email a one-time code that expires in 5 minutes.
            </p>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <p className="text-[11px] text-muted leading-relaxed">
              Sent a code to <span className="font-bold text-foreground">{email}</span>. Enter the 6
              digits below — and{" "}
              <span className="text-accent-primary font-bold">check your spam folder</span> if you
              don&apos;t see it.
            </p>

            <label className="block space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted">
                One-Time Code
              </span>
              <input
                ref={codeInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full px-3 py-3 text-2xl font-mono text-center tracking-[0.4em] tabular-nums bg-background border border-foreground/15 focus:border-accent-primary/50 focus:outline-none transition-colors"
                required
              />
            </label>

            {error && (
              <p className="text-xs font-mono text-accent-primary/80 border border-accent-primary/30 bg-accent-primary/5 px-3 py-2">
                {error}
              </p>
            )}

            {info && !error && (
              <p className="text-xs font-mono text-muted border border-foreground/10 bg-foreground/[0.02] px-3 py-2">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || code.length < 6}
              className="w-full px-4 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider bg-accent-primary text-background hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
            >
              {busy ? "Verifying…" : "Verify & Continue"}
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setStage("email");
                  setCode("");
                  setError(null);
                  setInfo(null);
                }}
                className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft size={11} />
                Wrong email?
              </button>
              <button
                type="button"
                disabled={busy || resendIn > 0}
                onClick={() => sendCode(email.trim(), true)}
                className="text-[10px] font-mono uppercase tracking-wider text-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
