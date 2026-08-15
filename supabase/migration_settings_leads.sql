-- =====================================================================
-- 3DVerse — Site settings + Lead tracking
-- Run once in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- =====================================================================

-- Site settings (single editable row that powers the whole site).
create table if not exists public.site_settings (
  id integer primary key default 1,
  business_name text default '3DVerse',
  owner text default 'Maksudur Rahman Rahat',
  location text default 'Sylhet, Bangladesh',
  email text default '3dverse.bd@gmail.com',
  phone text default '+8801357141040',
  whatsapp_number text default '8801357141040',
  tagline text default 'Custom 3D printed products, made in Sylhet.',
  description text default '3DVerse designs and 3D-prints made-to-order products from our studio in Sylhet, Bangladesh.',
  hero_headline text default 'Custom 3D printed products, made for you.',
  hero_subtext text default 'Anatomical models, personalised keyrings, home decor and gifts, designed and printed on demand. Browse the catalog and order in seconds over WhatsApp.',
  social_facebook text default 'https://www.facebook.com/3dversebd',
  social_instagram text default 'https://www.instagram.com/3dversebd/',
  social_tiktok text default 'https://www.tiktok.com/@3dversebd',
  social_youtube text default 'https://www.youtube.com/@3DVerseBD',
  social_telegram text default 'https://t.me/verse3d',
  review_url text default 'https://www.youtube.com/watch?v=gKxe9yfNt8c&list=PLTfEbDVspMGw',
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

alter table public.site_settings enable row level security;
drop policy if exists "Public can read settings" on public.site_settings;
create policy "Public can read settings" on public.site_settings for select using (true);
drop policy if exists "Auth can update settings" on public.site_settings;
create policy "Auth can update settings" on public.site_settings for update to authenticated using (true) with check (true);
drop policy if exists "Auth can insert settings" on public.site_settings;
create policy "Auth can insert settings" on public.site_settings for insert to authenticated with check (true);

-- Leads: one row per customer product interaction (view / order intent).
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  action text default 'view',              -- 'view' | 'order'
  product_id text default '',
  product_name text default '',
  product_slug text default '',
  ip text default '',
  country text default '',
  city text default '',
  region text default '',
  device text default '',
  browser text default '',
  os text default '',
  user_agent text default '',
  referrer text default '',
  page_url text default ''
);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

alter table public.leads enable row level security;
-- Visitors (anon) may only INSERT a lead; only the signed-in admin can read/delete.
drop policy if exists "Anyone can insert leads" on public.leads;
create policy "Anyone can insert leads" on public.leads for insert to anon, authenticated with check (true);
drop policy if exists "Auth can read leads" on public.leads;
create policy "Auth can read leads" on public.leads for select to authenticated using (true);
drop policy if exists "Auth can delete leads" on public.leads;
create policy "Auth can delete leads" on public.leads for delete to authenticated using (true);
