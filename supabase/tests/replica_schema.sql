-- Minimal local replica of the Supabase objects that the order / rate-limit
-- functions touch. Used only by supabase/tests/hardening.test.mjs against a
-- throwaway local Postgres; never run this against the real project.
create extension if not exists pgcrypto;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;

create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text);
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;

create table public.admin_emails (email text primary key);
insert into public.admin_emails values ('admin@example.com');
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as
  $$ select exists (select 1 from public.admin_emails where email = lower(coalesce(auth.jwt() ->> 'email', ''))) $$;

create table public.daily_counters (kind text, day date, seq int, primary key (kind, day));
alter table public.daily_counters enable row level security;

create table public.products (
  id uuid primary key default gen_random_uuid(), name text not null, price numeric not null,
  discount_percent numeric default 0, weight_kg numeric default 0.25);

create table public.delivery_tiers (max_kg numeric primary key, charge numeric not null, city_charge numeric);
insert into public.delivery_tiers values (1, 120, 70), (2, 210, 160), (3, 240, 190);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text,
  user_id uuid,
  customer_name text default '', customer_phone text default '', customer_address text default '',
  customer_email text not null default '',
  police_station text default '', note text default '',
  status text not null default 'new', payment_status text not null default 'pending',
  items jsonb not null default '[]',
  subtotal numeric default 0, delivery_charge numeric default 0, discount numeric default 0,
  total numeric default 0, cod_amount numeric default 0, weight_kg numeric default 0,
  steadfast_tracking_code text, steadfast_status text,
  cancelled_at timestamptz, cancelled_by text,
  created_at timestamptz default now(), updated_at timestamptz default now());
create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid references public.orders(id) on delete cascade,
  product_id uuid, product_name_snapshot text, unit_price_snapshot numeric, quantity int, weight_snapshot numeric);
create table public.delivery_payments (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  payment_method text, receiver_number text, transaction_id text, amount numeric,
  status text not null default 'pending', verified_at timestamptz, verified_by text,
  rejection_reason text, verification_method text);
create table public.order_events (
  id bigserial primary key, order_id uuid references public.orders(id) on delete cascade,
  type text, message text, actor text, created_at timestamptz default now());
create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(), order_id uuid references public.orders(id) on delete cascade,
  type text not null default 'new_order', title text not null default '', message text not null default '',
  read_at timestamptz, admin_email_sent_at timestamptz, created_at timestamptz default now(), unique (order_id, type));
create table public.cart_items (user_id uuid, product_id uuid, quantity int, primary key (user_id, product_id));
create table public.invoices (
  id uuid primary key default gen_random_uuid(), invoice_number text, order_id uuid unique,
  order_number_snapshot text, customer_name text, customer_phone text, customer_address text,
  customer_email text, items jsonb, subtotal numeric, delivery_charge numeric, discount numeric, total numeric);

create table public.subscribers (id uuid primary key default gen_random_uuid(), email text not null unique, created_at timestamptz default now());
create table public.comments (id uuid primary key default gen_random_uuid(), user_id uuid not null, product_id uuid, body text, status text default 'pending');
create table public.leads (id uuid primary key default gen_random_uuid(), product_id text default '', created_at timestamptz default now());
create table public.page_views (id bigserial primary key, path text, created_at timestamptz default now());
create table public.search_queries (id bigserial primary key, query text, created_at timestamptz default now());

-- Supabase-style table privileges + the public-insert policies that exist live.
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;
alter table public.subscribers enable row level security;
create policy "Anyone can subscribe" on public.subscribers for insert to anon, authenticated with check (true);
alter table public.leads enable row level security;
create policy "Anyone can insert leads" on public.leads for insert to anon, authenticated with check (true);
alter table public.page_views enable row level security;
create policy "pv insert" on public.page_views for insert to anon, authenticated with check (true);
alter table public.search_queries enable row level security;
create policy "sq insert" on public.search_queries for insert to anon, authenticated with check (true);
alter table public.comments enable row level security;
create policy "own review" on public.comments for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
