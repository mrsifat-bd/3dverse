-- =====================================================================
-- 3D Verse — Phase 7a: admin-only product reads (ADDITIVE, safe to apply now)
-- Security-definer RPCs so ADMIN can read full product rows (including the
-- internal production_cost) without any customer being able to. Apply this
-- FIRST, deploy the code that uses it, THEN apply _2_revoke.sql.
-- =====================================================================

-- All columns, admin only. Runs as owner (bypasses the caller's column privs),
-- but hard-gated by is_admin() so a logged-in customer gets an exception.
create or replace function public.admin_products()
returns setof public.products
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  return query select * from public.products order by created_at desc;
end $$;
revoke all on function public.admin_products() from public, anon;
grant execute on function public.admin_products() to authenticated;

create or replace function public.admin_product(p_id uuid)
returns setof public.products
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  return query select * from public.products where id = p_id;
end $$;
revoke all on function public.admin_product(uuid) from public, anon;
grant execute on function public.admin_product(uuid) to authenticated;
