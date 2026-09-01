-- =====================================================================
-- 3D Verse — Admin order notifications (in-app bell + admin email hook).
-- The order-creation flow is the source of truth: an AFTER INSERT trigger
-- on orders creates exactly ONE notification per CUSTOMER order (idempotent
-- via a unique constraint), so retries / refreshes / re-renders can never
-- duplicate it. Admin-created manual orders are skipped. Admin-only RLS.
-- =====================================================================

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  type text not null default 'new_order',
  title text not null default '',
  message text not null default '',
  read_at timestamptz,                 -- null = unread
  admin_email_sent_at timestamptz,     -- dedup anchor for the admin email
  created_at timestamptz not null default now(),
  unique (order_id, type)              -- one notification per order per type
);
create index if not exists admin_notifications_created_idx
  on public.admin_notifications (created_at desc);

alter table public.admin_notifications enable row level security;

-- Only admins can read notifications or mark them read. No INSERT policy —
-- rows are created solely by the security-definer trigger below (so customers
-- and anon can never write notifications through the API).
drop policy if exists "Admins read notifications" on public.admin_notifications;
create policy "Admins read notifications" on public.admin_notifications
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins update notifications" on public.admin_notifications;
create policy "Admins update notifications" on public.admin_notifications
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- One notification per new CUSTOMER order. is_admin() is true only when an
-- admin created the order manually (adminCreateOrder), so those are skipped —
-- the notification is for orders that come from the website.
create or replace function public.notify_admin_new_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  insert into public.admin_notifications (order_id, type, title, message)
  values (
    new.id,
    'new_order',
    'New order received',
    'Order ' || coalesce(nullif(new.order_number, ''), '') ||
      ' placed by ' || coalesce(nullif(new.customer_name, ''), 'a customer')
  )
  on conflict (order_id, type) do nothing;   -- concurrency / retry safe
  return new;
end $$;

drop trigger if exists orders_notify_admin on public.orders;
create trigger orders_notify_admin after insert on public.orders
  for each row execute function public.notify_admin_new_order();

-- Atomic "claim" for the admin email: sets admin_email_sent_at exactly once.
-- Returns true only on the first successful claim for a customer order (a row
-- exists), so the webhook route can never send duplicate admin emails even if
-- the webhook fires more than once. Admin-made orders have no row -> false.
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

-- Enable Supabase Realtime for the bell (live new-order badge). Guarded so
-- re-running the migration never errors.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.admin_notifications';
  end if;
exception when others then null;
end $$;
