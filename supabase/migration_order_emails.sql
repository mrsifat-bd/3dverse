-- =====================================================================
-- 3D Verse — Customer email notifications from admin Orders.
-- Adds orders.customer_email (auto-filled from the account) + an email event
-- log. Idempotent. Emails are SENT from a server route; this only stores state.
-- =====================================================================

-- 1) Recipient email on the order (registered users get it from their account;
--    admins can set it for manual/guest orders).
alter table public.orders add column if not exists customer_email text not null default '';

-- Backfill existing orders from the linked auth account.
update public.orders o
  set customer_email = u.email
  from auth.users u
  where o.user_id = u.id and coalesce(o.customer_email, '') = '' and u.email is not null;

-- Auto-fill on insert from the account when not explicitly provided (covers
-- checkout and admin-created orders) — avoids touching place_order again.
create or replace function public.set_order_customer_email()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if coalesce(new.customer_email, '') = '' and new.user_id is not null then
    select email into new.customer_email from auth.users where id = new.user_id;
    new.customer_email := coalesce(new.customer_email, '');
  end if;
  return new;
end $$;

drop trigger if exists orders_set_customer_email on public.orders;
create trigger orders_set_customer_email before insert on public.orders
  for each row execute function public.set_order_customer_email();

-- 2) Email event log (one row per send attempt). Admin-only.
create table if not exists public.order_email_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  email_type text not null,                 -- ORDER_CONFIRMED | SENT_FOR_DELIVERY | REVIEW_REQUEST
  recipient_email text not null default '',
  status text not null default 'sent',      -- sent | failed
  sent_at timestamptz,
  sent_by text not null default '',
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists order_email_events_order_idx on public.order_email_events (order_id, created_at desc);

alter table public.order_email_events enable row level security;
drop policy if exists "Admins manage order_email_events" on public.order_email_events;
create policy "Admins manage order_email_events" on public.order_email_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
