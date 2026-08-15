-- =====================================================================
-- 3D Verse — Invoice system + meaningful, concurrency-safe order numbers.
-- Idempotent. Integrates with existing orders/order_items/order_events.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Atomic per-day counters (Asia/Dhaka). One row per (kind, day); the
--    upsert takes a row lock so simultaneous orders never collide.
-- ---------------------------------------------------------------------
create table if not exists public.daily_counters (
  kind text not null,
  day  date not null,
  seq  int  not null default 0,
  primary key (kind, day)
);
alter table public.daily_counters enable row level security;
-- No public policies: only security-definer functions below touch this table.

-- Atomically bumps and returns today's (Dhaka) serial for a given kind.
create or replace function public.next_daily_seq(p_kind text)
returns table(d date, s int)
language plpgsql security definer set search_path = public
as $$
declare v_day date := (now() at time zone 'Asia/Dhaka')::date; v_seq int;
begin
  insert into public.daily_counters(kind, day, seq) values (p_kind, v_day, 1)
    on conflict (kind, day) do update set seq = public.daily_counters.seq + 1
    returning public.daily_counters.seq into v_seq;
  d := v_day; s := v_seq; return next;
end $$;

-- 3D-YYYYMMDD-XXX
create or replace function public.gen_order_number()
returns text language plpgsql security definer set search_path = public
as $$
declare r record;
begin
  select d, s into r from public.next_daily_seq('order');
  return '3D-' || to_char(r.d, 'YYYYMMDD') || '-' || lpad(r.s::text, 3, '0');
end $$;

-- 3D-INV-YYYYMMDD-XXX
create or replace function public.gen_invoice_number()
returns text language plpgsql security definer set search_path = public
as $$
declare r record;
begin
  select d, s into r from public.next_daily_seq('invoice');
  return '3D-INV-' || to_char(r.d, 'YYYYMMDD') || '-' || lpad(r.s::text, 3, '0');
end $$;

grant execute on function public.gen_order_number() to anon, authenticated;
grant execute on function public.gen_invoice_number() to anon, authenticated;
grant execute on function public.next_daily_seq(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Switch the orders.order_number default to the new generator.
--    Existing values are untouched; only new inserts use the new format.
-- ---------------------------------------------------------------------
alter table public.orders alter column order_number set default public.gen_order_number();

-- Renumber the single legacy order (DV-xxxxx) to the new dated format, and
-- prime the day counter so the next same-day order continues correctly.
do $$
declare o record; v_day date; v_seq int; v_new text;
begin
  for o in select id, created_at, steadfast_invoice from public.orders where order_number like 'DV-%' loop
    v_day := (o.created_at at time zone 'Asia/Dhaka')::date;
    insert into public.daily_counters(kind, day, seq) values ('order', v_day, 1)
      on conflict (kind, day) do update set seq = public.daily_counters.seq + 1
      returning seq into v_seq;
    v_new := '3D-' || to_char(v_day, 'YYYYMMDD') || '-' || lpad(v_seq::text, 3, '0');
    update public.orders set order_number = v_new where id = o.id;
    if coalesce(o.steadfast_invoice, '') <> '' then
      update public.orders set steadfast_invoice = v_new where id = o.id;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3) Invoices — frozen snapshot of the confirmed order. RLS: admin all;
--    a customer may read only the invoice for their own order.
-- ---------------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  order_number_snapshot text not null default '',
  invoice_date timestamptz not null default now(),
  -- customer snapshot
  customer_name text not null default '',
  customer_phone text not null default '',
  customer_address text not null default '',
  customer_email text not null default '',
  -- line items snapshot (frozen prices)
  items jsonb not null default '[]'::jsonb,
  -- money snapshot (frozen)
  subtotal numeric not null default 0,
  delivery_charge numeric not null default 0,
  discount numeric not null default 0,
  total numeric not null default 0,
  -- payment (manual, admin-editable): unpaid | partial | paid | refunded
  payment_status text not null default 'unpaid',
  payment_method text not null default 'cod',   -- cod | bkash | nagad | bank | other
  paid_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invoices_order_idx on public.invoices (order_id);

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

alter table public.invoices enable row level security;
drop policy if exists "Admins manage invoices" on public.invoices;
create policy "Admins manage invoices" on public.invoices
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Customers read own invoice" on public.invoices;
create policy "Customers read own invoice" on public.invoices
  for select to authenticated using (
    public.is_admin() or exists (
      select 1 from public.orders o where o.id = invoices.order_id and o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 4) Auto-generate an invoice when an order becomes 'confirmed'.
--    Idempotent (unique order_id + on-conflict). Never fires for other
--    statuses, so cancelled/new orders get no invoice.
-- ---------------------------------------------------------------------
create or replace function public.build_invoice_for_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare o record; v_email text;
begin
  select * into o from public.orders where id = p_order_id;
  if not found then return; end if;
  select email into v_email from auth.users where id = o.user_id;
  insert into public.invoices (
    invoice_number, order_id, order_number_snapshot, customer_name, customer_phone,
    customer_address, customer_email, items, subtotal, delivery_charge, discount, total
  ) values (
    public.gen_invoice_number(), o.id, o.order_number, o.customer_name, o.customer_phone,
    o.customer_address, coalesce(v_email, ''), coalesce(o.items, '[]'::jsonb),
    coalesce(o.subtotal, 0), coalesce(o.delivery_charge, 0), coalesce(o.discount, 0),
    greatest(0, coalesce(o.subtotal,0) + coalesce(o.delivery_charge,0) - coalesce(o.discount,0))
  ) on conflict (order_id) do nothing;
  if found then
    insert into public.order_events (order_id, type, message, actor)
    values (o.id, 'invoice_generated',
            'Invoice generated: ' || (select invoice_number from public.invoices where order_id = o.id), '');
  end if;
end $$;
grant execute on function public.build_invoice_for_order(uuid) to authenticated;

create or replace function public.on_order_confirmed()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'confirmed' and (old.status is distinct from 'confirmed') then
    perform public.build_invoice_for_order(new.id);
  end if;
  return new;
end $$;

drop trigger if exists orders_invoice_on_confirm on public.orders;
create trigger orders_invoice_on_confirm
  after update of status on public.orders
  for each row execute function public.on_order_confirmed();

-- Admin-callable explicit generation (only for already-confirmed orders).
create or replace function public.admin_generate_invoice(p_order_id uuid)
returns public.invoices language plpgsql security definer set search_path = public
as $$
declare v public.invoices;
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  if not exists (select 1 from public.orders where id = p_order_id and status = 'confirmed') then
    raise exception 'Order is not confirmed.';
  end if;
  perform public.build_invoice_for_order(p_order_id);
  select * into v from public.invoices where order_id = p_order_id;
  return v;
end $$;
grant execute on function public.admin_generate_invoice(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 5) Backfill: the existing confirmed order predates this trigger, so
--    generate its invoice now (idempotent).
-- ---------------------------------------------------------------------
do $$
declare o record;
begin
  for o in select id from public.orders where status = 'confirmed' loop
    perform public.build_invoice_for_order(o.id);
  end loop;
end $$;
