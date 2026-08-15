-- =====================================================================
-- 3DVerse — Checkout: secure server-side order placement (Phase 4)
-- Run after migration_ecommerce.sql. Idempotent.
--
-- place_order() runs as the logged-in customer, recomputes ALL money from the
-- trusted products table (ignores any client-sent prices), writes the order +
-- items + bKash delivery payment atomically, clears the cart, and returns the
-- order number. COD amount = product subtotal; delivery is prepaid via bKash.
-- =====================================================================
create or replace function public.place_order(
  p_name text,
  p_phone text,
  p_address text,
  p_note text,
  p_items jsonb,
  p_transaction_id text
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
begin
  if v_uid is null then raise exception 'You must be logged in to place an order.'; end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_address), '') = '' then
    raise exception 'Name and address are required.';
  end if;
  if p_phone !~ '^01[0-9]{9}$' then raise exception 'Invalid phone number.'; end if;
  if coalesce(trim(p_transaction_id), '') = '' then raise exception 'bKash transaction ID is required.'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Your cart is empty.'; end if;

  insert into public.orders (user_id, customer_name, customer_phone, customer_address, note, status, payment_status, items)
  values (v_uid, trim(p_name), p_phone, trim(p_address), coalesce(p_note, ''), 'new', 'pending', '[]'::jsonb)
  returning id, order_number into v_order_id, v_order_number;

  for v_elem in select * from jsonb_array_elements(p_items) loop
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

  v_delivery := public.compute_delivery_charge(v_weight);

  update public.orders set
    items = v_items,
    subtotal = v_subtotal,
    delivery_charge = v_delivery,
    discount = 0,
    total = v_subtotal,       -- COD collected on delivery = product subtotal
    cod_amount = v_subtotal,
    weight_kg = v_weight
  where id = v_order_id;

  insert into public.delivery_payments (order_id, payment_method, receiver_number, transaction_id, amount, status)
  values (v_order_id, 'bkash', '01846195474', trim(p_transaction_id), v_delivery, 'pending');

  insert into public.order_events (order_id, type, message, actor)
  values (v_order_id, 'created', 'Order placed. bKash txn ' || trim(p_transaction_id) || ' - awaiting verification.', '');

  delete from public.cart_items where user_id = v_uid;

  return jsonb_build_object('order_number', v_order_number, 'order_id', v_order_id, 'delivery', v_delivery, 'cod', v_subtotal);
end $$;

revoke all on function public.place_order(text, text, text, text, jsonb, text) from public;
grant execute on function public.place_order(text, text, text, text, jsonb, text) to authenticated;
