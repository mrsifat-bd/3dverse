-- =====================================================================
-- 3D Verse — Phase 7b: revoke production_cost from customers.
-- APPLY ONLY AFTER the code using admin_products()/admin_product() is
-- deployed. This removes the blanket table SELECT from `authenticated`
-- (which today lets any logged-in customer read production_cost) and
-- re-grants SELECT on every column EXCEPT production_cost.
-- anon already has column-level grants that exclude production_cost.
-- Writes (insert/update/delete) are unchanged; RLS still gates them by is_admin().
-- =====================================================================
revoke select on public.products from authenticated;

do $$
declare cols text;
begin
  select string_agg(quote_ident(column_name), ', ')
    into cols
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name <> 'production_cost';
  execute format('grant select (%s) on public.products to authenticated', cols);
end $$;
