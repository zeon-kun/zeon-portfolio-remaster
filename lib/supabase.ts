"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing. Copy .env.local.example to .env.local and fill in NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  if (!cached) {
    cached = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: "ikenbako-auth",
      },
    });
  }
  return cached;
}

export type TicketStatus = "open" | "planned" | "in_progress" | "done" | "wont_do";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  created_by: string;
  created_at: string;
  upvote_count: number;
}
