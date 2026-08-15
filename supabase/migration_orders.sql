-- =====================================================================
-- 3DVerse — Orders + Steadfast courier integration
-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Safe to re-run (idempotent).
-- =====================================================================

-- Human-friendly order numbers: DV-01001, DV-01002, ...
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique default ('DV-' || lpad(nextval('public.order_number_seq')::text, 5, '0')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Customer / delivery info
  customer_name text not null default '',
  customer_phone text not null default '',
  customer_address text not null default '',
  note text default '',

  -- Order items (snapshot at order time) + money
  items jsonb not null default '[]',           -- [{product_id,name,slug,unit_price,qty}]
  subtotal numeric not null default 0,
  delivery_charge numeric not null default 0,
  discount numeric not null default 0,
  total numeric not null default 0,
  cod_amount numeric not null default 0,
  weight_kg numeric not null default 0.5,       -- our record only (Steadfast create_order has no weight field)

  -- Internal order status:
  -- new | confirmed | ready | sent_to_steadfast | shipped | delivered | cancelled | returned | failed
  status text not null default 'new',

  -- Steadfast consignment info (filled after a successful API call)
  steadfast_invoice text,
  steadfast_consignment_id text,
  steadfast_tracking_code text,
  steadfast_status text,
  steadfast_created_at timestamptz,
  steadfast_updated_at timestamptz
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

-- Keep updated_at fresh on every update.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;

-- Customers do NOT insert directly (that would require SELECT to read the row
-- back and could let them set status/steadfast fields). They go through the
-- security-definer RPC below, which inserts a controlled row and returns only
-- the order number. Admins (authenticated) may still insert manually.
drop policy if exists "Anyone can insert orders" on public.orders;
drop policy if exists "Auth can insert orders" on public.orders;
create policy "Auth can insert orders" on public.orders
  for insert to authenticated with check (true);

-- Only the signed-in admin can read / update orders.
drop policy if exists "Auth can read orders" on public.orders;
create policy "Auth can read orders" on public.orders
  for select to authenticated using (true);

drop policy if exists "Auth can update orders" on public.orders;
create policy "Auth can update orders" on public.orders
  for update to authenticated using (true) with check (true);

drop policy if exists "Auth can delete orders" on public.orders;
create policy "Auth can delete orders" on public.orders
  for delete to authenticated using (true);

-- ---------------------------------------------------------------------
-- Customer order submission (anonymous, controlled). Computes money from the
-- item snapshot server-side and forces a fresh "new" order — customers can't
-- set status or courier fields. Returns only the human order number.
-- ---------------------------------------------------------------------
create or replace function public.create_customer_order(
  p_name text,
  p_phone text,
  p_address text,
  p_note text,
  p_items jsonb
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subtotal numeric := 0;
  v_order_number text;
begin
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_address), '') = '' then
    raise exception 'Missing required order fields';
  end if;
  if p_phone !~ '^01[0-9]{9}$' then
    raise exception 'Invalid phone number';
  end if;

  select coalesce(sum(((elem->>'unit_price')::numeric) * ((elem->>'qty')::numeric)), 0)
    into v_subtotal
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) elem;

  insert into public.orders (
    customer_name, customer_phone, customer_address, note, items,
    subtotal, delivery_charge, discount, total, cod_amount, weight_kg, status
  ) values (
    trim(p_name), p_phone, trim(p_address), coalesce(p_note, ''), coalesce(p_items, '[]'::jsonb),
    v_subtotal, 0, 0, v_subtotal, v_subtotal, 0.5, 'new'
  ) returning order_number into v_order_number;

  return v_order_number;
end $$;

revoke all on function public.create_customer_order(text, text, text, text, jsonb) from public;
grant execute on function public.create_customer_order(text, text, text, text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Order timeline / audit log (admin + courier events).
-- ---------------------------------------------------------------------
create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  type text not null default 'note',            -- created | confirmed | shipment_created | status | note | error
  message text not null default '',
  actor text default ''                          -- e.g. admin email or 'steadfast'
);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

alter table public.order_events enable row level security;

drop policy if exists "Auth can read order_events" on public.order_events;
create policy "Auth can read order_events" on public.order_events
  for select to authenticated using (true);

drop policy if exists "Auth can insert order_events" on public.order_events;
create policy "Auth can insert order_events" on public.order_events
  for insert to authenticated with check (true);

-- =====================================================================
-- NOTE: The webhook endpoint (optional) needs to update orders without an
-- admin session. It uses the Supabase SERVICE ROLE key server-side only.
-- If you don't configure the webhook, the admin "Refresh status" button
-- (on-demand, no constant polling) keeps statuses up to date.
-- =====================================================================
