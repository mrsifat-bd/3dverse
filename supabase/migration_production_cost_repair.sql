-- =====================================================================
-- 3D Verse — REPAIR: restore the private production_cost column.
-- The app (product form, write path, cost lockdown, estimator, invoices)
-- expects public.products.production_cost, but it was missing from this
-- database — so SAVING a product failed with the PostgREST error
-- "Could not find the 'production_cost' column of 'products' in the schema
-- cache". This re-adds it with the same admin-only lockdown as
-- model_source_url: neither anon nor authenticated can SELECT it; only the
-- admin_products()/admin_product() security-definer RPCs (gated by is_admin)
-- return it. Writes (INSERT/UPDATE) work because authenticated holds a
-- table-level write grant, gated by RLS is_admin().
-- =====================================================================

alter table public.products
  add column if not exists production_cost numeric;

-- Keep it private: a freshly added column has no column-level SELECT grant,
-- so anon/authenticated already cannot read it. Make that explicit.
revoke select (production_cost) on public.products from anon;
revoke select (production_cost) on public.products from authenticated;

-- Refresh the admin RPCs so their rowtype includes the restored column.
create or replace function public.admin_products()
returns setof public.products
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  return query select * from public.products order by created_at desc;
end $$;

create or replace function public.admin_product(p_id uuid)
returns setof public.products
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  return query select * from public.products where id = p_id;
end $$;

-- Apply immediately.
notify pgrst, 'reload schema';
