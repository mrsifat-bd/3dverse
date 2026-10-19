-- =============================================================================
-- Hardening part 2 (Oct 2026): database-backed rate limits and strict order
-- item / quantity validation. Apply after part 1.
--
-- Safe to run more than once. Does not change prices, delivery charges,
-- payment handling, refund rules or any existing order data.
--
-- Rollback notes are at the bottom of this file.
-- =============================================================================

-- 1. Rate limiting --------------------------------------------------------------
-- Stored in the database, so limits hold across every server instance and
-- every Vercel region. The table lives in a private schema that the public API
-- (anon / authenticated) cannot see. Fixed windows: simple, predictable, and
-- cheap; a burst of up to 2x the limit is possible at a window boundary.
create schema if not exists private;
revoke all on schema private from public;

create table if not exists private.rate_limits (
  bucket       text        not null,
  window_start timestamptz not null,
  hits         integer     not null default 0,
  primary key (bucket, window_start)
);
alter table private.rate_limits enable row level security; -- no policies: no direct access

-- Counts one hit and returns true while the bucket is within its limit.
-- The upsert takes a row lock, so concurrent requests are counted exactly.
create or replace function private.rate_limit_hit(p_bucket text, p_limit integer, p_window interval)
returns boolean language plpgsql security definer set search_path = private, pg_temp as $$
declare
  v_start timestamptz := date_bin(p_window, now(), timestamptz '2000-01-01 00:00:00+00');
  v_hits  integer;
begin
  insert into private.rate_limits (bucket, window_start, hits)
  values (left(p_bucket, 200), v_start, 1)
  on conflict (bucket, window_start) do update set hits = private.rate_limits.hits + 1
  returning hits into v_hits;
  -- Housekeeping on ~1% of calls: windows older than 2 days are useless.
  if random() < 0.01 then
    delete from private.rate_limits where window_start < now() - interval '2 days';
  end if;
  return v_hits <= p_limit;
end $$;

-- Raises RATE_LIMITED (no internal details) when the limit is exceeded. The
-- exception rolls back the caller's transaction, including this hit, so only
-- requests that actually went through are counted.
create or replace function private.enforce_rate_limit(p_bucket text, p_limit integer, p_window interval)
returns void language plpgsql security definer set search_path = private, pg_temp as $$
begin
  if not private.rate_limit_hit(p_bucket, p_limit, p_window) then
    raise exception 'RATE_LIMITED' using hint = 'Too many requests. Please wait a few minutes and try again.';
  end if;
end $$;

revoke all on function private.rate_limit_hit(text, integer, interval) from public;
revoke all on function private.enforce_rate_limit(text, integer, interval) from public;

-- Server routes (e.g. review photo upload) ask for a slot by action name. The
-- limits are fixed here, so a caller can never choose its own limit.
create or replace function public.consume_rate_limit(p_action text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_action = 'review_photo' then
    perform private.enforce_rate_limit('review_photo:' || v_uid, 10, interval '1 hour');
  else
    raise exception 'UNKNOWN_ACTION';
  end if;
end $$;
revoke all on function public.consume_rate_limit(text) from public, anon;
grant execute on function public.consume_rate_limit(text) to authenticated;

-- Generic trigger for tables the public API inserts into directly.
-- TG_ARGV: [0] bucket prefix, [1] column used as the key ('' = one shared
-- bucket), [2] limit, [3] window (interval text).
create or replace function private.rate_limit_insert()
returns trigger language plpgsql security definer set search_path = private, pg_temp as $$
declare v_key text := '';
begin
  if tg_argv[1] <> '' then
    v_key := lower(coalesce(to_jsonb(new) ->> tg_argv[1], ''));
  end if;
  perform private.enforce_rate_limit(tg_argv[0] || ':' || v_key, tg_argv[2]::integer, tg_argv[3]::interval);
  return new;
end $$;
revoke all on function private.rate_limit_insert() from public;

-- Newsletter: 3 attempts per email per day; 300 sign-ups per hour site-wide.
drop trigger if exists rl_subscribers_email on public.subscribers;
create trigger rl_subscribers_email before insert on public.subscribers
  for each row execute function private.rate_limit_insert('sub', 'email', '3', '1 day');
drop trigger if exists rl_subscribers_all on public.subscribers;
create trigger rl_subscribers_all before insert on public.subscribers
  for each row execute function private.rate_limit_insert('sub_all', '', '300', '1 hour');

-- Reviews: 10 per customer per hour.
drop trigger if exists rl_comments_user on public.comments;
create trigger rl_comments_user before insert on public.comments
  for each row execute function private.rate_limit_insert('review', 'user_id', '10', '1 hour');

-- Anonymous analytics / WhatsApp-click leads: site-wide caps far above real
-- traffic, so a script cannot fill the free-tier database.
drop trigger if exists rl_leads_all on public.leads;
create trigger rl_leads_all before insert on public.leads
  for each row execute function private.rate_limit_insert('lead_all', '', '3000', '1 hour');
drop trigger if exists rl_page_views_all on public.page_views;
create trigger rl_page_views_all before insert on public.page_views
  for each row execute function private.rate_limit_insert('pv_all', '', '20000', '1 hour');
drop trigger if exists rl_search_queries_all on public.search_queries;
create trigger rl_search_queries_all before insert on public.search_queries
  for each row execute function private.rate_limit_insert('sq_all', '', '5000', '1 hour');

-- 2. place_order: rate limit + strict item / quantity validation ----------------
-- Identical to the live version (migration_audit_fixes.sql) except:
--   * at most 5 orders per customer per 10 minutes and 30 per day;
--   * at most 50 cart lines; each quantity must be a whole number 1..1000
--     (1000 is an anti-abuse ceiling, not a business limit: customers may
--     order any custom amount up to it);
--   * malformed product ids give a clear error instead of a cast failure.
create or replace function public.place_order(
  p_name text,
  p_phone text,
  p_address text,
  p_note text,
  p_items jsonb,
  p_transaction_id text,
  p_police_station text default ''
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_weight numeric := 0;
  v_delivery numeric := 0;
  v_items jsonb := '[]'::jsonb;
  v_elem jsonb;
  v_pid uuid; v_qty int; v_qnum numeric;
  v_price numeric; v_disc numeric; v_wt numeric; v_name text; v_eff numeric;
  v_txn text;
begin
  if v_uid is null then raise exception 'You must be logged in to place an order.'; end if;
  perform private.enforce_rate_limit('order:' || v_uid, 5, interval '10 minutes');
  perform private.enforce_rate_limit('order_day:' || v_uid, 30, interval '1 day');

  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_address), '') = '' then
    raise exception 'Name and address are required.';
  end if;
  if p_phone !~ '^01[0-9]{9}$' then raise exception 'Invalid phone number.'; end if;

  v_txn := upper(regexp_replace(coalesce(p_transaction_id, ''), '\s', '', 'g'));
  if v_txn = '' then raise exception 'Please enter your bKash Transaction ID.'; end if;
  if v_txn !~ '^[A-Z0-9]{8,12}$' then raise exception 'Please enter a valid bKash Transaction ID.'; end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'INVALID_ITEMS: too many lines'; end if;

  -- Validate every line before anything is written.
  for v_elem in select * from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_elem) <> 'object'
       or coalesce(v_elem->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'INVALID_ITEMS: bad product';
    end if;
    if v_elem ? 'quantity' and jsonb_typeof(v_elem->'quantity') <> 'null' then
      if jsonb_typeof(v_elem->'quantity') <> 'number' then raise exception 'INVALID_QUANTITY'; end if;
      v_qnum := (v_elem->>'quantity')::numeric;
      if v_qnum <> trunc(v_qnum) or v_qnum < 1 or v_qnum > 1000 then raise exception 'INVALID_QUANTITY'; end if;
    end if;
  end loop;

  insert into public.orders (user_id, customer_name, customer_phone, customer_address, police_station, note, status, payment_status, items)
  values (v_uid, trim(p_name), p_phone, trim(p_address), coalesce(trim(p_police_station), ''), coalesce(p_note, ''), 'new', 'pending', '[]'::jsonb)
  returning id, order_number into v_order_id, v_order_number;

  for v_elem in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_elem->>'product_id')::uuid;
    v_qty := coalesce((v_elem->>'quantity')::numeric, 1)::int;
    select price, coalesce(discount_percent, 0), coalesce(weight_kg, 0), name
      into v_price, v_disc, v_wt, v_name
      from public.products where id = v_pid;
    if v_price is null then continue; end if;
    v_eff := round(v_price * (1 - v_disc / 100.0));
    v_subtotal := v_subtotal + v_eff * v_qty;
    v_weight := v_weight + v_wt * v_qty;
    insert into public.order_items (order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, weight_snapshot)
    values (v_order_id, v_pid, v_name, v_eff, v_qty, v_wt);
    v_items := v_items || jsonb_build_object('product_id', v_pid, 'name', v_name, 'unit_price', v_eff, 'qty', v_qty);
  end loop;

  if v_subtotal <= 0 then
    delete from public.orders where id = v_order_id;
    raise exception 'No valid products in the order.';
  end if;

  v_delivery := public.compute_delivery_charge_zone(v_weight, p_police_station);

  update public.orders set
    items = v_items,
    subtotal = v_subtotal,
    delivery_charge = v_delivery,
    discount = 0,
    total = v_subtotal,
    cod_amount = v_subtotal,
    weight_kg = v_weight
  where id = v_order_id;

  insert into public.delivery_payments (order_id, payment_method, receiver_number, transaction_id, amount, status)
  values (v_order_id, 'bkash', '01846195474', v_txn, v_delivery, 'pending');

  insert into public.order_events (order_id, type, message, actor)
  values (v_order_id, 'created', 'Order placed. bKash txn ' || v_txn || ' — awaiting manual verification.', '');

  delete from public.cart_items where user_id = v_uid;

  return jsonb_build_object('order_number', v_order_number, 'order_id', v_order_id, 'delivery', v_delivery, 'cod', v_subtotal);
end $$;

revoke all on function public.place_order(text, text, text, text, jsonb, text, text) from public, anon;
grant execute on function public.place_order(text, text, text, text, jsonb, text, text) to authenticated;

-- 3. cancel_my_order: same rules as before, plus 20 calls / 10 min per customer.
create or replace function public.cancel_my_order(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v public.orders;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  perform private.enforce_rate_limit('cancel:' || v_uid, 20, interval '10 minutes');

  select * into v from public.orders where id = p_order_id for update;
  -- Same answer for "doesn't exist" and "not yours": no order-id probing.
  if not found or v.user_id is distinct from v_uid then raise exception 'ORDER_NOT_FOUND'; end if;

  if v.status = 'cancelled' then
    return jsonb_build_object('ok', true, 'already', true, 'status', v.status, 'order_number', v.order_number);
  end if;
  if v.status <> 'new' or v.payment_status = 'verified' then
    raise exception 'NOT_CANCELLABLE';
  end if;

  update public.orders
     set status = 'cancelled', cancelled_at = now(), cancelled_by = 'customer'
   where id = p_order_id;

  insert into public.order_events (order_id, type, message, actor)
  values (p_order_id, 'status', 'Cancelled by the customer before verification.', coalesce(nullif(v.customer_email, ''), 'customer'));

  insert into public.admin_notifications (order_id, type, title, message)
  values (
    p_order_id, 'customer_cancelled', 'Order cancelled by customer',
    'Order ' || coalesce(v.order_number, '') || ' was cancelled by ' || coalesce(nullif(v.customer_name, ''), 'the customer') ||
      ' before verification. Refund the bKash delivery charge if it was paid.'
  )
  on conflict (order_id, type) do nothing;

  return jsonb_build_object('ok', true, 'already', false, 'status', 'cancelled', 'order_number', v.order_number);
end $$;
revoke all on function public.cancel_my_order(uuid) from public, anon;
grant execute on function public.cancel_my_order(uuid) to authenticated;

-- 4. track_order: limit guessing. 10 lookups per order number per 15 minutes
-- and 600 lookups per 15 minutes site-wide. (Was STABLE; now VOLATILE because
-- it records the attempt. supabase-js calls RPCs with POST, so callers are
-- unaffected.)
create or replace function public.track_order(p_order_number text, p_phone text)
returns jsonb language plpgsql volatile security definer set search_path = public
as $$
declare o public.orders%rowtype; v_phone text;
begin
  v_phone := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 11);
  if length(v_phone) <> 11 or coalesce(trim(p_order_number), '') = '' then return null; end if;
  perform private.enforce_rate_limit('track:' || upper(left(trim(p_order_number), 40)), 10, interval '15 minutes');
  perform private.enforce_rate_limit('track_all', 600, interval '15 minutes');
  select * into o from public.orders
   where upper(order_number) = upper(trim(p_order_number))
     and right(regexp_replace(customer_phone, '\D', '', 'g'), 11) = v_phone
   limit 1;
  if not found then return null; end if;
  return jsonb_build_object(
    'order_number', o.order_number,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'status', o.status,
    'payment_status', o.payment_status,
    'items', (select coalesce(jsonb_agg(jsonb_build_object('name', e->>'name', 'qty', e->'qty', 'unit_price', e->'unit_price')), '[]'::jsonb)
                from jsonb_array_elements(o.items) e),
    'subtotal', o.subtotal,
    'delivery_charge', o.delivery_charge,
    'cod_amount', o.cod_amount,
    'tracking_code', o.steadfast_tracking_code,
    'courier_status', o.steadfast_status
  );
end $$;
revoke all on function public.track_order(text, text) from public;
grant execute on function public.track_order(text, text) to anon, authenticated;

-- =============================================================================
-- ROLLBACK (run only if needed; restores the previous behaviour exactly):
--   1) Re-run the place_order and track_order blocks from migration_audit_fixes.sql
--      and the cancel_my_order block from migration_i18n_cancel.sql.
--   2) drop trigger rl_subscribers_email on public.subscribers;
--      drop trigger rl_subscribers_all on public.subscribers;
--      drop trigger rl_comments_user on public.comments;
--      drop trigger rl_leads_all on public.leads;
--      drop trigger rl_page_views_all on public.page_views;
--      drop trigger rl_search_queries_all on public.search_queries;
--      drop function public.consume_rate_limit(text);
--   (private.rate_limits can stay; it is unreachable from the API.)
-- =============================================================================
