-- =====================================================================
-- 3D Verse — Private 3D model source link on products (admin-only).
-- Lets the admin store the link to the source 3D model file for each
-- product, to download later for printing. This is INTERNAL: customers
-- and the public site never see it. Same lockdown pattern as
-- production_cost — the anon/authenticated roles get NO select privilege
-- on the column; only the admin_products()/admin_product() security-
-- definer RPCs (gated by is_admin) return it.
-- =====================================================================

alter table public.products
  add column if not exists model_source_url text not null default '';

-- authenticated already has only a column-list SELECT grant (from the cost
-- lockdown) that excludes any newly added column, so it cannot read this one.
revoke select (model_source_url) on public.products from authenticated;

-- anon, however, still holds a TABLE-level SELECT grant on products — which
-- silently covers every column, including this new one AND production_cost.
-- A column-level revoke cannot remove a table-level grant, so drop the
-- table-level grant and re-grant an explicit column list that excludes BOTH
-- private columns. This also closes the pre-existing production_cost exposure
-- to the public anon role. Public reads only ever request PUBLIC_COLUMNS, so
-- the site is unaffected.
revoke select on public.products from anon;
do $$
declare cols text;
begin
  select string_agg(quote_ident(column_name), ', ')
    into cols
    from information_schema.columns
    where table_schema = 'public' and table_name = 'products'
      and column_name not in ('production_cost', 'model_source_url');
  execute format('grant select (%s) on public.products to anon', cols);
end $$;

-- Refresh the admin RPCs so their rowtype picks up the new column.
-- They already `select *`, so no body change is needed beyond re-resolving.
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
