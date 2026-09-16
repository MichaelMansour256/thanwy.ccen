-- ============================================================================
-- thanwy.ccen — complete Supabase setup (prayer wall + notification history)
-- Paste this WHOLE file into: Supabase Dashboard → SQL Editor → New query → Run
--
-- Why "anon" policies? The site's API routes call Supabase with the anon key
-- (the project has no user logins), so RLS must allow those four operations
-- for `anon`. What the public sees is still controlled by the API routes
-- themselves: GET /api/prayer only returns rows with status = 'approved',
-- and new requests are inserted as 'pending' until an admin approves them.
-- ============================================================================

-- ─── Prayer wall ────────────────────────────────────────────────────────────
create table if not exists prayer_requests (
  id uuid primary key default gen_random_uuid(),
  name text,
  request text not null,
  pray_count int not null default 0,
  status text not null default 'pending', -- pending | approved | rejected
  created_at timestamptz not null default now()
);

alter table prayer_requests enable row level security;

drop policy if exists "anon insert prayer_requests" on prayer_requests;
create policy "anon insert prayer_requests" on prayer_requests
  for insert to anon with check (true);

drop policy if exists "anon read prayer_requests" on prayer_requests;
create policy "anon read prayer_requests" on prayer_requests
  for select to anon using (true);

drop policy if exists "anon update prayer_requests" on prayer_requests;
create policy "anon update prayer_requests" on prayer_requests
  for update to anon using (true) with check (true);

drop policy if exists "anon delete prayer_requests" on prayer_requests;
create policy "anon delete prayer_requests" on prayer_requests
  for delete to anon using (true);

-- ─── Notification history ───────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

create table if not exists notifications_history (
  id uuid primary key default uuid_generate_v4(),
  sent_at text not null,
  heading_ar text not null default '',
  heading_en text not null default '',
  message_ar text not null default '',
  message_en text not null default '',
  url text not null default '/ar',
  image text,
  onesignal_id text,
  status text not null default 'sent',
  recipients integer,
  created_at text not null,
  error text
);

create index if not exists idx_notifications_sent_at
  on notifications_history(sent_at desc);

alter table notifications_history enable row level security;

drop policy if exists "anon insert notifications_history" on notifications_history;
create policy "anon insert notifications_history" on notifications_history
  for insert to anon with check (true);

drop policy if exists "anon read notifications_history" on notifications_history;
create policy "anon read notifications_history" on notifications_history
  for select to anon using (true);
