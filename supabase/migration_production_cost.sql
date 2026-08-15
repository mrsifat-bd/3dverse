-- =====================================================================
-- 3DVerse — private internal "production cost" (admin-only, never public)
-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- =====================================================================

-- 1. Add the internal cost column (nullable).
alter table public.products
  add column if not exists production_cost numeric;

-- 2. Column-level security.
--    Postgres RLS is ROW-level, so to hide a COLUMN we use column privileges:
--    revoke the anon (public) role's table-wide SELECT, then grant SELECT on
--    every column EXCEPT production_cost. After this, any anonymous `select *`
--    ERRORS — public queries must name columns explicitly (the app does).
revoke select on public.products from anon;
grant select (
  id, name, slug, price, description, category, tags, image_url,
  in_stock, created_at, discount_percent, review_url, extra_link,
  extra_link_label, faqs, is_popular
) on public.products to anon;

-- 3. The signed-in admin (authenticated role) keeps full access, incl. production_cost.
grant select, insert, update, delete on public.products to authenticated;

-- 4. Reload PostgREST's schema cache so the grant change applies immediately.
notify pgrst, 'reload schema';
