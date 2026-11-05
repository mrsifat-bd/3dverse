-- =============================================================================
-- Interactive Skeleton Builder — part 2 of 2: checkout.
-- Apply AFTER migration_skeleton_1_tables.sql, at launch, just before the new
-- website code goes live.
--
-- place_order() keeps its exact signature and its exact behaviour for normal
-- products (same lines, same prices from public.products, same delivery
-- charge, same bKash record). The only addition: a cart line
--   { "kind": "skeleton", "config": { "pieces": [...] } }
-- is priced by public.skeleton_quote() from the database's own approved
-- prices. Any price, total or name sent by the browser is ignored. One builder
-- line per order; an invalid configuration stops the order with a clear error.
-- The frozen breakdown is saved on order_items.config_snapshot and in
-- orders.items (so admin, invoice, emails and tracking show the exact bones).
--
-- Rollback: re-run the place_order block from migration_audit_fixes.sql and
--   drop function if exists public.skeleton_checkout_ready();
-- (builder orders already placed keep their snapshot).
-- =============================================================================

create or replace function public.skeleton_checkout_ready()
returns boolean language sql immutable as $$ select true $$;
grant execute on function public.skeleton_checkout_ready() to anon, authenticated;

-- Readable lines for admin, invoice and emails, e.g. "Femur (Right) — ৳1,560".
create or replace function public.skeleton_detail_lines(p_quote jsonb)
returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(
    case l ->> 'type'
      when 'set' then (l ->> 'name_en') || ' — ৳' || to_char((l ->> 'amount')::numeric, 'FM999,999,990')
      when 'included' then 'Included: ' || (l ->> 'name_en')
        || case l ->> 'side' when 'L' then ' (Left)' when 'R' then ' (Right)' else '' end
        || case when (l ->> 'qty')::int > 1 then ' ×' || (l ->> 'qty') else '' end
      else (l ->> 'name_en')
        || case l ->> 'side' when 'L' then ' (Left)' when 'R' then ' (Right)' else '' end
        || case when (l ->> 'qty')::int > 1 then ' ×' || (l ->> 'qty') else '' end
        || case when (l ->> 'amount')::numeric > 0 then ' — ৳' || to_char((l ->> 'amount')::numeric, 'FM999,999,990') else '' end
    end order by ord), '[]'::jsonb)
  from jsonb_array_elements(coalesce(p_quote -> 'lines', '[]'::jsonb)) with ordinality as t(l, ord)
$$;

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
  v_pid uuid; v_qty int;
  v_price numeric; v_disc numeric; v_wt numeric; v_name text; v_eff numeric;
  v_txn text;
  v_quote jsonb; v_sk_count int := 0; v_sk_name text; v_sk_bn text; v_snapshot jsonb;
begin
  if v_uid is null then raise exception 'You must be logged in to place an order.'; end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_address), '') = '' then
    raise exception 'Name and address are required.';
  end if;
  if p_phone !~ '^01[0-9]{9}$' then raise exception 'Invalid phone number.'; end if;

  v_txn := upper(regexp_replace(coalesce(p_transaction_id, ''), '\s', '', 'g'));
  if v_txn = '' then raise exception 'Please enter your bKash Transaction ID.'; end if;
  if v_txn !~ '^[A-Z0-9]{8,12}$' then raise exception 'Please enter a valid bKash Transaction ID.'; end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Your cart is empty.'; end if;

  insert into public.orders (user_id, customer_name, customer_phone, customer_address, police_station, note, status, payment_status, items)
  values (v_uid, trim(p_name), p_phone, trim(p_address), coalesce(trim(p_police_station), ''), coalesce(p_note, ''), 'new', 'pending', '[]'::jsonb)
  returning id, order_number into v_order_id, v_order_number;

  for v_elem in select * from jsonb_array_elements(p_items) loop
    if v_elem ->> 'kind' = 'skeleton' then
      -- Interactive Skeleton Builder line: priced only by the database.
      v_sk_count := v_sk_count + 1;
      if v_sk_count > 1 then raise exception 'Only one skeleton builder configuration per order.'; end if;
      v_quote := public.skeleton_quote(v_elem -> 'config');
      if not coalesce((v_quote ->> 'ok')::boolean, false) then
        raise exception 'Your skeleton selection is no longer valid (%). Please open the builder again.', coalesce(v_quote ->> 'error', 'invalid');
      end if;
      if coalesce((v_quote ->> 'total')::numeric, 0) <= 0 then raise exception 'Your skeleton selection is empty.'; end if;
      v_eff := (v_quote ->> 'total')::numeric;
      v_wt := coalesce((v_quote ->> 'weight_kg')::numeric, 0);
      v_sk_name := 'Interactive Skeleton Builder' || case v_quote ->> 'set' when 'full' then ' — Complete Full Set' when 'half' then ' — Complete Half Set' else '' end;
      v_sk_bn := 'ইন্টারঅ্যাক্টিভ স্কেলেটন বিল্ডার' || case v_quote ->> 'set' when 'full' then ' — কমপ্লিট ফুল সেট' when 'half' then ' — কমপ্লিট হাফ সেট' else '' end;
      v_snapshot := jsonb_build_object('config', v_elem -> 'config', 'quote', v_quote, 'priced_at', now());
      v_subtotal := v_subtotal + v_eff;
      v_weight := v_weight + v_wt;
      insert into public.order_items (order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, weight_snapshot, config_snapshot)
      values (v_order_id, null, v_sk_name, v_eff, 1, v_wt, v_snapshot);
      v_items := v_items || jsonb_build_object('kind', 'skeleton', 'product_id', null, 'name', v_sk_name, 'name_bn', v_sk_bn,
        'unit_price', v_eff, 'qty', 1, 'set', v_quote -> 'set', 'details', public.skeleton_detail_lines(v_quote));
      continue;
    end if;

    v_pid := (v_elem->>'product_id')::uuid;
    v_qty := greatest(1, coalesce((v_elem->>'quantity')::int, 1));
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
  if v_sk_count > 0 then delete from public.skeleton_carts where user_id = v_uid; end if;

  return jsonb_build_object('order_number', v_order_number, 'order_id', v_order_id, 'delivery', v_delivery, 'cod', v_subtotal);
end $$;

revoke all on function public.place_order(text, text, text, text, jsonb, text, text) from public;
grant execute on function public.place_order(text, text, text, text, jsonb, text, text) to authenticated;
