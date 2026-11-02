-- =============================================================================
-- Nov 2026: (1) a product can appear in more than one category,
--           (2) admins can see registered customer accounts.
-- Safe to run more than once. Changes no existing data (new column defaults
-- to an empty list). Rollback notes at the bottom.
-- =============================================================================

-- 1. Extra categories ----------------------------------------------------------
alter table public.products
  add column if not exists extra_categories text[] not null default '{}';

-- products uses column-level SELECT grants (production_cost / model link are
-- private), so a new column is invisible until granted explicitly.
grant select (extra_categories) on public.products to anon, authenticated;

create index if not exists products_extra_categories_idx
  on public.products using gin (extra_categories);

-- Category ranking counts a product in its main AND its extra categories.
create or replace function public.public_categories_ranked()
returns table(id uuid, name text, slug text, blurb text, sort int, product_count bigint)
language sql stable security definer set search_path = public
as $$
  select c.id, c.name, c.slug, c.blurb, c.sort,
         count(p.id) filter (where coalesce(p.status, 'active') = 'active') as product_count
  from public.categories c
  left join public.products p
    on p.category = c.slug or c.slug = any(p.extra_categories)
  where c.status = 'active'
  group by c.id, c.name, c.slug, c.blurb, c.sort
  order by count(p.id) filter (where coalesce(p.status, 'active') = 'active') desc, c.name asc;
$$;
grant execute on function public.public_categories_ranked() to anon, authenticated;

-- 2. Registered customers (admin only) ---------------------------------------
-- auth.users is not reachable through the API, so this read-only function
-- returns a safe subset (no passwords, tokens or raw metadata) to admins.
create or replace function public.admin_customers()
returns table(
  id uuid, email text, full_name text, phone text, provider text,
  email_confirmed boolean, created_at timestamptz, last_sign_in_at timestamptz,
  order_count bigint, last_order_at timestamptz
)
language plpgsql stable security definer set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = '42501';
  end if;
  return query
    select u.id,
           u.email::text,
           coalesce(nullif(pr.full_name, ''), u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')::text,
           coalesce(nullif(pr.phone, ''), '')::text,
           coalesce(u.raw_app_meta_data ->> 'provider', 'email')::text,
           (u.email_confirmed_at is not null),
           u.created_at,
           u.last_sign_in_at,
           count(o.id),
           max(o.created_at)
    from auth.users u
    left join public.profiles pr on pr.user_id = u.id
    left join public.orders o on o.user_id = u.id
    group by u.id, u.email, pr.full_name, pr.phone, u.raw_user_meta_data, u.raw_app_meta_data,
             u.email_confirmed_at, u.created_at, u.last_sign_in_at
    order by u.created_at desc;
end;
$$;
revoke all on function public.admin_customers() from public, anon;
grant execute on function public.admin_customers() to authenticated;

-- =============================================================================
-- ROLLBACK
--   drop function if exists public.admin_customers();
--   -- restore the old ranking (main category only):
--   --   ... left join public.products p on p.category = c.slug ...
--   drop index if exists products_extra_categories_idx;
--   alter table public.products drop column if exists extra_categories;
-- =============================================================================
