-- =====================================================================
-- 3D Verse — audit fixes (Oct 2026). Idempotent: safe to run more than once.
--
--  1. Islamic Items category slug "i" -> "islamic-items"
--  2. Trademark: rename the Porsche wall-art product (old URL is redirected
--     in next.config.mjs)
--  3. Product weights: products left on the 0.5 kg form default (and the two
--     Human Heart models) get the shop's own rule:
--        filament grams = price / 6,  parcel weight = filament + 80 g
--     Weight drives the delivery charge, so heavy sets were undercharged.
--  4. Copy: product descriptions that still said "order on WhatsApp", and
--     the homepage subtext that promised keyrings (none are sold)
--  5. Delivery zones: Sylhet city (Sylhet Sadar / Dakshin Surma thana) pays
--     less; place_order() now charges by weight AND zone
--  6. Reviews: star rating, customer photo, "verified buyer" flag
--  7. Review photo storage bucket
--  8. Public order tracking by order number + phone (no login)
-- =====================================================================

-- 1) Category slug ------------------------------------------------------
update public.categories set slug = 'islamic-items' where slug = 'i';
update public.products   set category = 'islamic-items' where category = 'i';

-- 2) Trademark ----------------------------------------------------------
update public.products
   set name = 'GT Sports Car Wall Art',
       slug = 'gt-sports-car-wall-art',
       description = regexp_replace(description, 'Porsche 911 GT3 RS', 'GT sports car', 'gi')
 where slug = 'porsche-911-gt3-rs-wall-art';

-- 3) Weights ------------------------------------------------------------
update public.products
   set weight_kg = round(((price / 6.0) + 80) / 1000.0, 3)
 where price > 0
   and (weight_kg = 0.5 or slug in ('human-heart', 'human-heart-with-stand'));

update public.products
   set description = replace(description, '(approx. 0.6 kg)',
                             '(approx. ' || ((round(price / 60.0) * 10)::int) || ' g)')
 where slug in ('human-heart', 'human-heart-with-stand')
   and description like '%(approx. 0.6 kg)%';

-- 4) Copy ---------------------------------------------------------------
update public.products
   set description = replace(description,
         'Custom colours and sizes available — order on WhatsApp.',
         'Custom colours and sizes available on request. Order online: delivery charge via bKash, product price cash on delivery.')
 where description like '%order on WhatsApp.%';

update public.site_settings
   set hero_subtext = 'Explore high-quality 3D-printed anatomical and bone models, Islamic décor, desk organisers, phone stands and everyday essentials. Thoughtfully designed and printed with precision by 3D Verse in Sylhet.'
 where hero_subtext ilike '%keyring%';

-- 5) Delivery zones -----------------------------------------------------
alter table public.delivery_tiers add column if not exists city_charge numeric;
update public.delivery_tiers set city_charge = greatest(charge - 50, 0) where city_charge is null;

-- Police-station labels that count as Sylhet city.
create or replace function public.is_sylhet_city(p_police_station text)
returns boolean language sql immutable
as $$
  select lower(trim(coalesce(p_police_station, ''))) in ('sylhet sadar, sylhet', 'dakshinsurma, sylhet');
$$;

create or replace function public.compute_delivery_charge_zone(p_weight numeric, p_police_station text)
returns numeric language plpgsql stable security definer set search_path = public
as $$
declare v_city boolean := public.is_sylhet_city(p_police_station);
        v_charge numeric; v_top_charge numeric; v_top_max numeric;
begin
  if p_weight is null or p_weight <= 0 then p_weight := 0.01; end if;
  select case when v_city then coalesce(city_charge, charge) else charge end
    into v_charge from public.delivery_tiers
   where p_weight <= max_kg order by max_kg asc limit 1;
  if v_charge is not null then return v_charge; end if;
  select case when v_city then coalesce(city_charge, charge) else charge end, max_kg
    into v_top_charge, v_top_max from public.delivery_tiers order by max_kg desc limit 1;
  if v_top_charge is null then return case when v_city then 70 else 120 end; end if;
  return v_top_charge + ceil(greatest(p_weight - v_top_max, 0)) * 30;
end $$;
grant execute on function public.compute_delivery_charge_zone(numeric, text) to anon, authenticated;

-- Same signature as before; only the delivery line changed (weight + zone).
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

  return jsonb_build_object('order_number', v_order_number, 'order_id', v_order_id, 'delivery', v_delivery, 'cod', v_subtotal);
end $$;

revoke all on function public.place_order(text, text, text, text, jsonb, text, text) from public;
grant execute on function public.place_order(text, text, text, text, jsonb, text, text) to authenticated;

-- 6) Reviews ------------------------------------------------------------
alter table public.comments add column if not exists rating smallint;
alter table public.comments add column if not exists photo_url text not null default '';
alter table public.comments add column if not exists verified boolean not null default false;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'comments_rating_range') then
    alter table public.comments add constraint comments_rating_range check (rating is null or rating between 1 and 5);
  end if;
end $$;

-- "Verified buyer" is decided by the database, never by the browser: true
-- only when this user has a confirmed (or later) order containing the product.
create or replace function public.set_comment_verified()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  new.verified := exists (
    select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
     where o.user_id = new.user_id
       and oi.product_id = new.product_id
       and o.status in ('confirmed', 'ready', 'sent_to_steadfast', 'shipped', 'delivered')
  );
  -- Only our own review-photo bucket is accepted.
  if coalesce(new.photo_url, '') <> '' and new.photo_url !~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/review-photos/' then
    new.photo_url := '';
  end if;
  return new;
end $$;
drop trigger if exists comments_set_verified on public.comments;
create trigger comments_set_verified before insert on public.comments
  for each row execute function public.set_comment_verified();

-- 7) Review photos bucket (public read; uploads go through /api/review-photos
--    using the customer's own session, into reviews/<their user id>/...)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 2097152, array['image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/webp'];

drop policy if exists "Customers upload own review photos" on storage.objects;
create policy "Customers upload own review photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = 'reviews'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
drop policy if exists "Admins manage review photos" on storage.objects;
create policy "Admins manage review photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'review-photos' and public.is_admin())
  with check (bucket_id = 'review-photos' and public.is_admin());

-- 8) Public order tracking ---------------------------------------------
-- Returns a customer-safe summary only when BOTH the order number and the
-- phone number on the order match. No internal notes, no payment IDs.
create or replace function public.track_order(p_order_number text, p_phone text)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare o public.orders%rowtype; v_phone text;
begin
  v_phone := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 11);
  if length(v_phone) <> 11 or coalesce(trim(p_order_number), '') = '' then return null; end if;
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
