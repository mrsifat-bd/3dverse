-- =====================================================================
-- 3D Verse — Rank active categories by number of active products (DB-side
-- aggregation, so the frontend never fetches all products to count). Sorted
-- by product_count DESC, then name ASC as a stable tie-breaker. Idempotent.
-- =====================================================================
create or replace function public.public_categories_ranked()
returns table(id uuid, name text, slug text, blurb text, sort int, product_count bigint)
language sql stable security definer set search_path = public
as $$
  select c.id, c.name, c.slug, c.blurb, c.sort,
         count(p.id) filter (where coalesce(p.status, 'active') = 'active') as product_count
  from public.categories c
  left join public.products p on p.category = c.slug
  where c.status = 'active'
  group by c.id, c.name, c.slug, c.blurb, c.sort
  order by count(p.id) filter (where coalesce(p.status, 'active') = 'active') desc, c.name asc;
$$;

grant execute on function public.public_categories_ranked() to anon, authenticated;
