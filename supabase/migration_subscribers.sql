-- =====================================================================
-- 3DVerse — Email subscribers (mailing list for promotions/contact)
-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- =====================================================================

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text default '',
  source text default '',
  created_at timestamptz not null default now()
);
create index if not exists subscribers_created_at_idx on public.subscribers (created_at desc);

alter table public.subscribers enable row level security;
-- Visitors (anon) can add themselves; only the signed-in admin can read/delete.
drop policy if exists "Anyone can subscribe" on public.subscribers;
create policy "Anyone can subscribe" on public.subscribers for insert to anon, authenticated with check (true);
drop policy if exists "Auth can read subscribers" on public.subscribers;
create policy "Auth can read subscribers" on public.subscribers for select to authenticated using (true);
drop policy if exists "Auth can delete subscribers" on public.subscribers;
create policy "Auth can delete subscribers" on public.subscribers for delete to authenticated using (true);
