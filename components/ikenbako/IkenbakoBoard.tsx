"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Plus, LogOut, AlertCircle } from "lucide-react";
import { getSupabase, isSupabaseConfigured, type Ticket } from "@/lib/supabase";
import { TicketCard } from "./TicketCard";
import { SubmitForm } from "./SubmitForm";
import { AuthGate } from "./AuthGate";

type ModalState =
  | { kind: "none" }
  | { kind: "auth"; intent: "submit" | "vote" }
  | { kind: "submit" };

export function IkenbakoBoard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [myUpvotes, setMyUpvotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  const refreshTickets = useCallback(async () => {
    const supabase = getSupabase();
    const { data, error: err } = await supabase
      .from("tickets")
      .select("*")
      .order("upvote_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    if (err) {
      setError(err.message);
      return;
    }
    setTickets((data ?? []) as Ticket[]);
  }, []);

  const refreshMyUpvotes = useCallback(async (userId: string | null) => {
    if (!userId) {
      setMyUpvotes(new Set());
      return;
    }
    const supabase = getSupabase();
    const { data, error: err } = await supabase
      .from("ticket_upvotes")
      .select("ticket_id")
      .eq("user_id", userId);
    if (err) return;
    setMyUpvotes(new Set((data ?? []).map((r) => r.ticket_id as string)));
  }, []);

  // Initial load + auth subscription
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const supabase = getSupabase();
    let mounted = true;

    (async () => {
      const [{ data: sessData }] = await Promise.all([
        supabase.auth.getSession(),
        refreshTickets(),
      ]);
      if (!mounted) return;
      setSession(sessData.session);
      await refreshMyUpvotes(sessData.session?.user.id ?? null);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      refreshMyUpvotes(newSession?.user.id ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [refreshTickets, refreshMyUpvotes]);

  const handleVote = useCallback(
    async (ticketId: string) => {
      if (!session) {
        setModal({ kind: "auth", intent: "vote" });
        return;
      }
      const supabase = getSupabase();
      const userId = session.user.id;
      const hadVoted = myUpvotes.has(ticketId);

      // Optimistic update
      setMyUpvotes((prev) => {
        const next = new Set(prev);
        if (hadVoted) next.delete(ticketId);
        else next.add(ticketId);
        return next;
      });
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, upvote_count: Math.max(0, t.upvote_count + (hadVoted ? -1 : 1)) }
            : t,
        ),
      );

      const { error: err } = hadVoted
        ? await supabase
            .from("ticket_upvotes")
            .delete()
            .eq("ticket_id", ticketId)
            .eq("user_id", userId)
        : await supabase
            .from("ticket_upvotes")
            .insert({ ticket_id: ticketId, user_id: userId });

      if (err) {
        // Revert
        setMyUpvotes((prev) => {
          const next = new Set(prev);
          if (hadVoted) next.add(ticketId);
          else next.delete(ticketId);
          return next;
        });
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? { ...t, upvote_count: Math.max(0, t.upvote_count + (hadVoted ? 1 : -1)) }
              : t,
          ),
        );
        setError(err.message);
      }
    },
    [session, myUpvotes],
  );

  const handleSubmitClick = useCallback(() => {
    if (!session) {
      setModal({ kind: "auth", intent: "submit" });
      return;
    }
    setModal({ kind: "submit" });
  }, [session]);

  const handleSignOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  const handleAuthSuccess = useCallback(
    (intent: "submit" | "vote") => {
      setModal(intent === "submit" ? { kind: "submit" } : { kind: "none" });
    },
    [],
  );

  // ─── Not configured fallback ───
  if (!isSupabaseConfigured) {
    return (
      <div className="border border-accent-primary/30 bg-accent-primary/5 p-6 flex items-start gap-3">
        <AlertCircle size={16} className="text-accent-primary shrink-0 mt-0.5" />
        <div className="space-y-2 text-sm">
          <p className="font-bold tracking-wider text-foreground">Backend not configured</p>
          <p className="text-muted text-xs leading-relaxed">
            The 意見箱 needs Supabase env vars. Copy{" "}
            <code className="text-[11px]">.env.local.example</code> to{" "}
            <code className="text-[11px]">.env.local</code> and fill in your project keys, then run
            the migration in <code className="text-[11px]">supabase/migrations/</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-foreground/8">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted/50">
            {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
          </span>
          {session && (
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-accent-primary/70">
              {session.user.email}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {session && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border border-foreground/15 text-muted hover:text-foreground hover:border-foreground/30 transition-all duration-150"
            >
              <LogOut size={11} />
              Sign Out
            </button>
          )}
          <button
            onClick={handleSubmitClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border border-accent-primary/30 text-accent-primary/80 hover:text-accent-primary hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-all duration-150"
          >
            <Plus size={11} />
            New Ticket
          </button>
        </div>
      </div>

      {/* ─── Error banner ─── */}
      {error && (
        <div className="mb-4 border border-accent-primary/30 bg-accent-primary/5 px-4 py-2.5 flex items-center justify-between text-xs">
          <span className="text-accent-primary/80 font-mono">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-accent-primary/60 hover:text-accent-primary text-[10px] font-mono uppercase tracking-wider"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── List ─── */}
      {loading ? (
        <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted/50 py-12 text-center">
          Loading tickets…
        </p>
      ) : tickets.length === 0 ? (
        <div className="border border-dashed border-foreground/15 p-10 text-center space-y-2">
          <p className="text-sm text-foreground/70">No tickets yet.</p>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted/50">
            Be the first to drop one
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              hasVoted={myUpvotes.has(ticket.id)}
              onVote={() => handleVote(ticket.id)}
            />
          ))}
        </ul>
      )}

      {/* ─── Modals ─── */}
      {modal.kind === "auth" && (
        <AuthGate
          intent={modal.intent}
          onClose={() => setModal({ kind: "none" })}
          onSuccess={() => handleAuthSuccess(modal.intent)}
        />
      )}

      {modal.kind === "submit" && session && (
        <SubmitForm
          userId={session.user.id}
          onClose={() => setModal({ kind: "none" })}
          onSuccess={async () => {
            setModal({ kind: "none" });
            await refreshTickets();
          }}
        />
      )}
    </>
  );
}
