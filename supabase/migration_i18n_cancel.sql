-- =============================================================================
-- Bangla content columns, customer order cancellation, race-safe payment
-- verification and nationwide wording.
--
-- Safe to run more than once. Everything is additive: new NULLABLE columns,
-- new functions, and three text updates guarded by their current value.
-- No rows are deleted and no existing column changes type.
--
-- Rollback (if ever needed):
--   drop function if exists public.cancel_my_order(uuid);
--   drop function if exists public.admin_verify_delivery_payment(uuid);
--   drop function if exists public.admin_reject_delivery_payment(uuid, text);
--   (the new nullable columns can stay; old code ignores them)
--   Old settings text is recorded in comments at the end of this file.
-- =============================================================================

-- 1. Optional Bangla content. English stays the source of truth; the site
--    falls back to English wherever a Bangla value is empty.
alter table public.products   add column if not exists name_bn text;
alter table public.products   add column if not exists description_bn text;
-- products uses column-level SELECT grants (cost lockdown), so new columns
-- must be granted explicitly or public reads would fail.
grant select (name_bn, description_bn) on public.products to anon, authenticated;

alter table public.categories add column if not exists name_bn text;

alter table public.site_settings add column if not exists hero_headline_bn text;
alter table public.site_settings add column if not exists hero_subtext_bn  text;
alter table public.site_settings add column if not exists tagline_bn       text;

-- Bangla category names (only fills empty values; admin can edit later).
update public.categories c set name_bn = v.bn
from (values
  ('plant-pot', 'গাছের টব'),
  ('phone-stand', 'ফোন স্ট্যান্ড'),
  ('desktop-accessories', 'ডেস্কটপ অ্যাক্সেসরিজ'),
  ('aquarium-accessories', 'অ্যাকুয়ারিয়াম অ্যাক্সেসরিজ'),
  ('wall-decoration', 'দেয়াল সজ্জা'),
  ('pen-holder', 'পেন হোল্ডার'),
  ('islamic-items', 'ইসলামিক পণ্য'),
  ('medical-bone-models', 'মেডিকেল ও বোন মডেল'),
  ('gadgets', 'গ্যাজেট'),
  ('aquarium', 'অ্যাকুয়ারিয়াম'),
  ('desk-accessories', 'ডেস্ক ও অ্যাক্সেসরিজ'),
  ('home-decor', 'ঘর সাজানো'),
  ('gifts', 'উপহার')
) as v(slug, bn)
where c.slug = v.slug and (c.name_bn is null or c.name_bn = '');

-- 2. Customer cancellation -----------------------------------------------------
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists cancelled_by text;   -- 'customer' | 'admin' | null

-- A customer may cancel ONLY their own order, ONLY while it is still awaiting
-- verification (status 'new' and payment not verified). The row is locked, so
-- a simultaneous admin verification and customer cancellation can never both
-- succeed: whichever commits first wins and the other sees the new status.
-- The order is never deleted. Payment records are not touched: the bKash
-- delivery-charge refund stays a manual admin step (published refund policy).
create or replace function public.cancel_my_order(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v public.orders;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

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

-- 3. Race-safe admin payment verification / rejection --------------------------
-- Replaces two separate client-side updates (which could overwrite a customer
-- cancellation that happened in between) with one locked transaction.
create or replace function public.admin_verify_delivery_payment(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v public.orders;
  v_admin text := coalesce(auth.jwt() ->> 'email', '');
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  select * into v from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v.status = 'cancelled' then raise exception 'ORDER_CANCELLED'; end if;

  update public.delivery_payments
     set status = 'verified', verified_at = now(), verified_by = v_admin,
         verification_method = 'manual', rejection_reason = null
   where order_id = p_order_id;
  update public.orders set payment_status = 'verified', status = 'confirmed' where id = p_order_id;
  insert into public.order_events (order_id, type, message, actor)
  values (p_order_id, 'status', 'Payment manually verified by admin (pending → paid) — order confirmed.', v_admin);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.admin_verify_delivery_payment(uuid) from public, anon;
grant execute on function public.admin_verify_delivery_payment(uuid) to authenticated;

create or replace function public.admin_reject_delivery_payment(p_order_id uuid, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v public.orders;
  v_admin text := coalesce(auth.jwt() ->> 'email', '');
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  select * into v from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v.status = 'cancelled' then raise exception 'ORDER_CANCELLED'; end if;

  update public.delivery_payments
     set status = 'rejected', verified_at = now(), verified_by = v_admin,
         verification_method = 'manual', rejection_reason = nullif(p_reason, '')
   where order_id = p_order_id;
  update public.orders set payment_status = 'rejected' where id = p_order_id;
  insert into public.order_events (order_id, type, message, actor)
  values (p_order_id, 'status', 'Payment rejected by admin (pending → rejected)' ||
          case when coalesce(p_reason, '') <> '' then ': ' || p_reason else '' end, v_admin);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.admin_reject_delivery_payment(uuid, text) from public, anon;
grant execute on function public.admin_reject_delivery_payment(uuid, text) to authenticated;

-- 4. Nationwide wording in site settings (only if still the old text) ----------
-- Old values (for rollback):
--   tagline      = 'Custom 3D printed products, made in Sylhet.'
--   description  = '3DVerse designs and 3D-prints made-to-order products from our studio in Sylhet, Bangladesh.'
--   hero_subtext = 'Explore high-quality 3D-printed anatomical and bone models, Islamic décor, desk organisers, phone stands and everyday essentials. Thoughtfully designed and printed with precision by 3D Verse in Sylhet.'
update public.site_settings set tagline = 'Custom 3D printed products, delivered across Bangladesh.'
 where id = 1 and tagline = 'Custom 3D printed products, made in Sylhet.';
update public.site_settings set description = '3DVerse designs and 3D-prints made-to-order products for customers across Bangladesh.'
 where id = 1 and description = '3DVerse designs and 3D-prints made-to-order products from our studio in Sylhet, Bangladesh.';
update public.site_settings set hero_subtext = 'Explore high-quality 3D-printed anatomical and bone models, Islamic décor, desk organisers, phone stands and everyday essentials. Thoughtfully designed and printed with precision by 3D Verse, delivered across Bangladesh.'
 where id = 1 and hero_subtext = 'Explore high-quality 3D-printed anatomical and bone models, Islamic décor, desk organisers, phone stands and everyday essentials. Thoughtfully designed and printed with precision by 3D Verse in Sylhet.';

-- Bangla versions of the home hero and tagline (only fills empty values).
update public.site_settings set
  hero_headline_bn = coalesce(nullif(hero_headline_bn, ''), 'মানসম্পন্ন ৩ডি প্রিন্টিং, যত্নে তৈরি নকশা।'),
  hero_subtext_bn  = coalesce(nullif(hero_subtext_bn, ''), 'অ্যানাটমিক্যাল ও বোন মডেল, ইসলামিক ডেকোর, ডেস্ক অর্গানাইজার, ফোন স্ট্যান্ডসহ নিত্যপ্রয়োজনীয় জিনিস। 3D Verse যত্ন নিয়ে নিখুঁতভাবে প্রিন্ট করে, সারা বাংলাদেশে ডেলিভারি দেয়।'),
  tagline_bn       = coalesce(nullif(tagline_bn, ''), 'অর্ডার অনুযায়ী তৈরি ৩ডি প্রিন্টেড পণ্য, সারা বাংলাদেশে ডেলিভারি।')
 where id = 1;
