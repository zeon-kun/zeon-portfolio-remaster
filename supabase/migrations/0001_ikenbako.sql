-- 意見箱 (Ikenbako) — feature request / pain-point board
--
-- Tables:
--   tickets         user-submitted feature requests
--   ticket_upvotes  one row per (ticket, user) — composite PK prevents double-voting
--
-- Row counts in tickets.upvote_count are kept in sync via trigger so the
-- public list query can sort by upvotes without a join.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.tickets (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 3 and 120),
  description   text not null check (char_length(description) between 10 and 2000),
  status        text not null default 'open'
                check (status in ('open', 'planned', 'in_progress', 'done', 'wont_do')),
  created_by    uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  upvote_count  integer not null default 0
);

create index if not exists tickets_created_at_idx   on public.tickets (created_at desc);
create index if not exists tickets_upvote_count_idx on public.tickets (upvote_count desc);

create table if not exists public.ticket_upvotes (
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (ticket_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────
-- Upvote count trigger
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.update_ticket_upvote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.tickets
       set upvote_count = upvote_count + 1
     where id = NEW.ticket_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.tickets
       set upvote_count = greatest(upvote_count - 1, 0)
     where id = OLD.ticket_id;
    return OLD;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_ticket_upvotes_count on public.ticket_upvotes;
create trigger trg_ticket_upvotes_count
after insert or delete on public.ticket_upvotes
for each row execute function public.update_ticket_upvote_count();

-- ─────────────────────────────────────────────────────────────────────
-- Row-Level Security
-- ─────────────────────────────────────────────────────────────────────

alter table public.tickets        enable row level security;
alter table public.ticket_upvotes enable row level security;

-- Tickets: public read, authenticated insert/update/delete-own
drop policy if exists tickets_select_all on public.tickets;
create policy tickets_select_all on public.tickets
  for select using (true);

drop policy if exists tickets_insert_own on public.tickets;
create policy tickets_insert_own on public.tickets
  for insert to authenticated
  with check (auth.uid() = created_by);

drop policy if exists tickets_update_own on public.tickets;
create policy tickets_update_own on public.tickets
  for update to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

drop policy if exists tickets_delete_own on public.tickets;
create policy tickets_delete_own on public.tickets
  for delete to authenticated
  using (auth.uid() = created_by);

-- Upvotes: a user can only see/insert/delete their own row.
-- Aggregate counts are exposed via tickets.upvote_count.
drop policy if exists upvotes_select_own on public.ticket_upvotes;
create policy upvotes_select_own on public.ticket_upvotes
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists upvotes_insert_own on public.ticket_upvotes;
create policy upvotes_insert_own on public.ticket_upvotes
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists upvotes_delete_own on public.ticket_upvotes;
create policy upvotes_delete_own on public.ticket_upvotes
  for delete to authenticated
  using (auth.uid() = user_id);
