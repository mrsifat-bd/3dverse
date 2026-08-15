-- =====================================================================
-- 3DVerse — dashboard data: lead status pipeline + visitor/search tracking
-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- =====================================================================

-- 1. Lead status pipeline (applies to WhatsApp order-intent leads).
alter table public.leads
  add column if not exists status text not null default 'new';
-- Allow the signed-in admin to update a lead's status.
drop policy if exists "Auth can update leads" on public.leads;
create policy "Auth can update leads" on public.leads
  for update to authenticated using (true) with check (true);

-- 2. Site-wide page views (anonymous visitor tracking).
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path text default '',
  visitor_id text default '',
  referrer text default '',
  device text default '',
  browser text default '',
  os text default '',
  user_agent text default ''
);
create index if not exists page_views_created_at_idx on public.page_views (created_at desc);
alter table public.page_views enable row level security;
drop policy if exists "Anyone can insert page_views" on public.page_views;
create policy "Anyone can insert page_views" on public.page_views for insert to anon, authenticated with check (true);
drop policy if exists "Auth can read page_views" on public.page_views;
create policy "Auth can read page_views" on public.page_views for select to authenticated using (true);

-- 3. Search queries.
create table if not exists public.search_queries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  query text default '',
  visitor_id text default ''
);
create index if not exists search_queries_created_at_idx on public.search_queries (created_at desc);
alter table public.search_queries enable row level security;
drop policy if exists "Anyone can insert search_queries" on public.search_queries;
create policy "Anyone can insert search_queries" on public.search_queries for insert to anon, authenticated with check (true);
drop policy if exists "Auth can read search_queries" on public.search_queries;
create policy "Auth can read search_queries" on public.search_queries for select to authenticated using (true);
