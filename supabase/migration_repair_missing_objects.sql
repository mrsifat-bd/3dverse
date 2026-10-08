-- =====================================================================
-- 3D Verse — repair: objects the app uses that were missing from the
-- production database (migration_dashboard / migration_admin_notifications
-- were never applied). Safe to re-run. Uses the FINAL, tightened policies
-- (admin-only reads) from migration_ecommerce rather than the early ones.
-- =====================================================================

-- 1. Lead status pipeline (admin Leads page dropdown).
alter table public.leads add column if not exists status text not null default 'new';

-- 2. Anonymous visitor + search tracking (insert-only for visitors,
--    readable by admins only).
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
drop policy if exists "Admins read page_views" on public.page_views;
create policy "Admins read page_views" on public.page_views for select to authenticated using (public.is_admin());

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
drop policy if exists "Admins read search_queries" on public.search_queries;
create policy "Admins read search_queries" on public.search_queries for select to authenticated using (public.is_admin());

-- 3. Admin new-order notifications (bell) + email dedup claim.
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  type text not null default 'new_order',
  title text not null default '',
  message text not null default '',
  read_at timestamptz,
  admin_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, type)
);
create index if not exists admin_notifications_created_idx on public.admin_notifications (created_at desc);
alter table public.admin_notifications enable row level security;
drop policy if exists "Admins read notifications" on public.admin_notifications;
create policy "Admins read notifications" on public.admin_notifications
  for select to authenticated using (public.is_admin());
drop policy if exists "Admins update notifications" on public.admin_notifications;
create policy "Admins update notifications" on public.admin_notifications
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.notify_admin_new_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  insert into public.admin_notifications (order_id, type, title, message)
  values (new.id, 'new_order', 'New order received',
    'Order ' || coalesce(nullif(new.order_number, ''), '') ||
      ' placed by ' || coalesce(nullif(new.customer_name, ''), 'a customer'))
  on conflict (order_id, type) do nothing;
  return new;
end $$;
revoke all on function public.notify_admin_new_order() from public, anon, authenticated;

drop trigger if exists orders_notify_admin on public.orders;
create trigger orders_notify_admin after insert on public.orders
  for each row execute function public.notify_admin_new_order();

create or replace function public.claim_new_order_email(p_order_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare claimed boolean := false;
begin
  update public.admin_notifications
     set admin_email_sent_at = now()
   where order_id = p_order_id and type = 'new_order' and admin_email_sent_at is null
   returning true into claimed;
  return coalesce(claimed, false);
end $$;
revoke all on function public.claim_new_order_email(uuid) from public;
grant execute on function public.claim_new_order_email(uuid) to anon, authenticated;

-- Realtime for the live bell badge (guarded).
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_notifications') then
    execute 'alter publication supabase_realtime add table public.admin_notifications';
  end if;
exception when others then null;
end $$;

select json_build_object('__r', 1, 'ok', true,
  'tables', (select json_agg(table_name) from information_schema.tables where table_schema = 'public'
             and table_name in ('page_views','search_queries','admin_notifications')),
  'lead_status', (select count(*) from information_schema.columns where table_schema='public' and table_name='leads' and column_name='status'),
  'claim_fn', (select count(*) from pg_proc where proname = 'claim_new_order_email')) as r;
