-- =====================================================================
-- 3DVerse — Supabase schema (Next.js + Admin CMS)
-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- =====================================================================

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  price       numeric not null default 0,
  description text default '',
  category    text default 'miscellaneous',
  tags        text[] default '{}',
  image_url   text[] default '{}',
  in_stock    boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_created_at_idx on public.products (created_at desc);
create index if not exists products_tags_idx on public.products using gin (tags);

-- ---------------------------------------------------------------------
-- Row Level Security
--   Public (anon)  -> can READ products.
--   Authenticated  -> can INSERT / UPDATE / DELETE (the admin, signed in).
-- ---------------------------------------------------------------------
alter table public.products enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products for select using (true);

drop policy if exists "Authenticated can insert products" on public.products;
create policy "Authenticated can insert products"
  on public.products for insert to authenticated with check (true);

drop policy if exists "Authenticated can update products" on public.products;
create policy "Authenticated can update products"
  on public.products for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated can delete products" on public.products;
create policy "Authenticated can delete products"
  on public.products for delete to authenticated using (true);

-- ---------------------------------------------------------------------
-- Storage bucket for product images.
--   Public read; only authenticated users can upload/change/delete.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
  on storage.objects for select using (bucket_id = 'product-images');

drop policy if exists "Authenticated can upload product images" on storage.objects;
create policy "Authenticated can upload product images"
  on storage.objects for insert to authenticated with check (bucket_id = 'product-images');

drop policy if exists "Authenticated can update product images" on storage.objects;
create policy "Authenticated can update product images"
  on storage.objects for update to authenticated using (bucket_id = 'product-images');

drop policy if exists "Authenticated can delete product images" on storage.objects;
create policy "Authenticated can delete product images"
  on storage.objects for delete to authenticated using (bucket_id = 'product-images');

-- =====================================================================
-- Create the admin user in Dashboard -> Authentication -> Users -> Add user
-- (email + password). That account can sign in at /admin.
-- =====================================================================
