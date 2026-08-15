-- =====================================================================
-- 3DVerse — E-commerce foundation (Phase 1)
-- Roles, profiles, categories, cart/wishlist/likes/comments, order_items,
-- delivery payments, delivery tiers, and a full RLS rewrite that separates
-- ADMIN from CUSTOMER. Idempotent — safe to re-run.
--
-- Admin identity = email allowlist (public.admin_emails). Seed below.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Roles: admin allowlist + is_admin() helper
-- ---------------------------------------------------------------------
create table if not exists public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);
insert into public.admin_emails (email) values ('3dverse.bd@gmail.com')
  on conflict (email) do nothing;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admin_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.admin_emails enable row level security;
drop policy if exists "Admins manage admin_emails" on public.admin_emails;
create policy "Admins manage admin_emails" on public.admin_emails
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 2) Profiles (auto-created on signup)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  default_address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, phone)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          coalesce(new.raw_user_meta_data ->> 'phone', ''))
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert to authenticated with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 3) Categories (DB-driven; replaces hardcoded list over time)
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  blurb text default '',
  status text not null default 'active',   -- active | inactive
  sort int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.categories (name, slug, blurb, sort) values
  ('Medical & Bone Models', 'medical-bone-models', 'Anatomical skull parts, vertebrae, skeletons and study sets for students and clinics.', 1),
  ('Gadgets', 'gadgets', 'Mounts, cases, racks and functional tech accessories.', 2),
  ('Aquarium', 'aquarium', 'Decorative caves, formations and aquascaping pieces.', 3),
  ('Desk & Accessories', 'desk-accessories', 'Pen holders, stands, organisers and everyday desk essentials.', 4),
  ('Home Decor', 'home-decor', 'Wall art, decor and sculptural pieces for the home.', 5),
  ('Gifts', 'gifts', 'Thoughtful, made-to-order gifts for every occasion.', 6)
on conflict (slug) do nothing;

alter table public.categories enable row level security;
drop policy if exists "Public read active categories" on public.categories;
create policy "Public read active categories" on public.categories
  for select to anon, authenticated using (status = 'active' or public.is_admin());
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 4) Delivery tiers + server-side charge calculation
-- ---------------------------------------------------------------------
create table if not exists public.delivery_tiers (
  id uuid primary key default gen_random_uuid(),
  max_kg numeric not null,        -- upper bound (inclusive) of this tier
  charge numeric not null,
  sort int not null default 0
);
insert into public.delivery_tiers (max_kg, charge, sort)
select v.max_kg, v.charge, v.sort from (values
  (1::numeric, 120::numeric, 1),
  (2::numeric, 210::numeric, 2),
  (3::numeric, 240::numeric, 3)
) as v(max_kg, charge, sort)
where not exists (select 1 from public.delivery_tiers);

-- Returns the delivery charge for a total weight (kg). Above the top tier,
-- adds a per-kg surcharge (default 30) for each extra kg. Configurable via tiers.
create or replace function public.compute_delivery_charge(p_weight numeric)
returns numeric language plpgsql stable security definer set search_path = public
as $$
declare v_charge numeric; v_top_charge numeric; v_top_max numeric;
begin
  if p_weight is null or p_weight <= 0 then p_weight := 0.01; end if;
  select charge into v_charge from public.delivery_tiers
    where p_weight <= max_kg order by max_kg asc limit 1;
  if v_charge is not null then return v_charge; end if;
  select charge, max_kg into v_top_charge, v_top_max from public.delivery_tiers
    order by max_kg desc limit 1;
  if v_top_charge is null then return 120; end if;
  return v_top_charge + ceil(greatest(p_weight - v_top_max, 0)) * 30;
end $$;
grant execute on function public.compute_delivery_charge(numeric) to anon, authenticated;

alter table public.delivery_tiers enable row level security;
drop policy if exists "Public read delivery_tiers" on public.delivery_tiers;
create policy "Public read delivery_tiers" on public.delivery_tiers
  for select to anon, authenticated using (true);
drop policy if exists "Admins manage delivery_tiers" on public.delivery_tiers;
create policy "Admins manage delivery_tiers" on public.delivery_tiers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 5) Extend products (additive; keeps existing `category` text working)
-- ---------------------------------------------------------------------
alter table public.products add column if not exists weight_kg numeric not null default 0.5;
alter table public.products add column if not exists category_id uuid references public.categories(id);
alter table public.products add column if not exists status text not null default 'active';
-- Backfill category_id from the existing category slug.
update public.products p set category_id = c.id
  from public.categories c where p.category_id is null and p.category = c.slug;

-- ---------------------------------------------------------------------
-- 6) Extend orders for logged-in customers + bKash payment status
-- ---------------------------------------------------------------------
alter table public.orders add column if not exists user_id uuid references auth.users(id);
-- payment_status: pending | verified | rejected  (bKash delivery-charge payment)
alter table public.orders add column if not exists payment_status text not null default 'pending';
create index if not exists orders_user_idx on public.orders (user_id);

-- ---------------------------------------------------------------------
-- 7) Cart / wishlist / likes / comments
-- ---------------------------------------------------------------------
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
alter table public.cart_items enable row level security;
drop policy if exists "Users manage own cart" on public.cart_items;
create policy "Users manage own cart" on public.cart_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
alter table public.wishlists enable row level security;
drop policy if exists "Users manage own wishlist" on public.wishlists;
create policy "Users manage own wishlist" on public.wishlists
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.product_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
alter table public.product_likes enable row level security;
drop policy if exists "Anyone reads like counts" on public.product_likes;
create policy "Anyone reads like counts" on public.product_likes
  for select to anon, authenticated using (true);
drop policy if exists "Users manage own likes" on public.product_likes;
create policy "Users manage own likes" on public.product_likes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  user_name text not null default '',
  comment text not null,
  status text not null default 'pending',   -- pending | approved | rejected
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by text
);
create index if not exists comments_product_idx on public.comments (product_id, status);
alter table public.comments enable row level security;
drop policy if exists "Public read approved comments" on public.comments;
create policy "Public read approved comments" on public.comments
  for select to anon, authenticated
  using (status = 'approved' or user_id = auth.uid() or public.is_admin());
drop policy if exists "Users submit own comments" on public.comments;
create policy "Users submit own comments" on public.comments
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "Admins moderate comments" on public.comments;
create policy "Admins moderate comments" on public.comments
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins delete comments" on public.comments;
create policy "Admins delete comments" on public.comments
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- 8) Order line items + delivery (bKash) payments  (relational, snapshotted)
-- ---------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name_snapshot text not null default '',
  unit_price_snapshot numeric not null default 0,
  quantity int not null default 1,
  weight_snapshot numeric not null default 0
);
create index if not exists order_items_order_idx on public.order_items (order_id);
alter table public.order_items enable row level security;
drop policy if exists "Read own or admin order_items" on public.order_items;
create policy "Read own or admin order_items" on public.order_items
  for select to authenticated using (
    public.is_admin() or exists (
      select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );
drop policy if exists "Admins write order_items" on public.order_items;
create policy "Admins write order_items" on public.order_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.delivery_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_method text not null default 'bkash',
  receiver_number text not null default '',
  transaction_id text not null default '',
  amount numeric not null default 0,
  status text not null default 'pending',   -- pending | verified | rejected
  submitted_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by text,
  rejection_reason text
);
create index if not exists delivery_payments_order_idx on public.delivery_payments (order_id);
alter table public.delivery_payments enable row level security;
-- A customer may read ONLY their own payment (never another customer's txn id).
drop policy if exists "Read own or admin delivery_payments" on public.delivery_payments;
create policy "Read own or admin delivery_payments" on public.delivery_payments
  for select to authenticated using (
    public.is_admin() or exists (
      select 1 from public.orders o where o.id = delivery_payments.order_id and o.user_id = auth.uid()
    )
  );
drop policy if exists "Admins write delivery_payments" on public.delivery_payments;
create policy "Admins write delivery_payments" on public.delivery_payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 9) RLS REWRITE on existing tables: replace blanket "authenticated"
--    grants with is_admin(), and let customers read their OWN orders.
-- ---------------------------------------------------------------------

-- products: keep public read; admin-only writes.
drop policy if exists "Authenticated can insert products" on public.products;
drop policy if exists "Authenticated can update products" on public.products;
drop policy if exists "Authenticated can delete products" on public.products;
create policy "Admins insert products" on public.products for insert to authenticated with check (public.is_admin());
create policy "Admins update products" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete products" on public.products for delete to authenticated using (public.is_admin());

-- orders: customer reads own; admin all. Writes admin-only (customer checkout
-- goes through a security-definer RPC added in Phase 4).
drop policy if exists "Auth can read orders" on public.orders;
drop policy if exists "Auth can insert orders" on public.orders;
drop policy if exists "Auth can update orders" on public.orders;
drop policy if exists "Auth can delete orders" on public.orders;
create policy "Read own or admin orders" on public.orders
  for select to authenticated using (public.is_admin() or user_id = auth.uid());
create policy "Admins insert orders" on public.orders for insert to authenticated with check (public.is_admin());
create policy "Admins update orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete orders" on public.orders for delete to authenticated using (public.is_admin());

-- order_events: customer reads events of own orders; admin all; admin writes.
drop policy if exists "Auth can read order_events" on public.order_events;
drop policy if exists "Auth can insert order_events" on public.order_events;
create policy "Read own or admin order_events" on public.order_events
  for select to authenticated using (
    public.is_admin() or exists (
      select 1 from public.orders o where o.id = order_events.order_id and o.user_id = auth.uid()
    )
  );
create policy "Admins insert order_events" on public.order_events for insert to authenticated with check (public.is_admin());

-- leads: admin-only read/update/delete; keep anon insert.
drop policy if exists "Auth can read leads" on public.leads;
drop policy if exists "Auth can update leads" on public.leads;
drop policy if exists "Auth can delete leads" on public.leads;
create policy "Admins read leads" on public.leads for select to authenticated using (public.is_admin());
create policy "Admins update leads" on public.leads for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete leads" on public.leads for delete to authenticated using (public.is_admin());

-- subscribers: admin-only read/delete; keep public subscribe.
drop policy if exists "Auth can read subscribers" on public.subscribers;
drop policy if exists "Auth can delete subscribers" on public.subscribers;
create policy "Admins read subscribers" on public.subscribers for select to authenticated using (public.is_admin());
create policy "Admins delete subscribers" on public.subscribers for delete to authenticated using (public.is_admin());

-- site_settings: keep public read; admin-only writes.
drop policy if exists "Auth can insert settings" on public.site_settings;
drop policy if exists "Auth can update settings" on public.site_settings;
create policy "Admins insert settings" on public.site_settings for insert to authenticated with check (public.is_admin());
create policy "Admins update settings" on public.site_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- analytics: admin-only read; keep anon insert.
drop policy if exists "Auth can read page_views" on public.page_views;
create policy "Admins read page_views" on public.page_views for select to authenticated using (public.is_admin());
drop policy if exists "Auth can read search_queries" on public.search_queries;
create policy "Admins read search_queries" on public.search_queries for select to authenticated using (public.is_admin());

-- =====================================================================
-- NOTE (tracked for Phase 7): products.production_cost is currently granted
-- to the `authenticated` role at the column level, so it will move to an
-- admin-only path when the product form is reworked. It is never selected by
-- public code today (PUBLIC_COLUMNS excludes it).
-- =====================================================================
