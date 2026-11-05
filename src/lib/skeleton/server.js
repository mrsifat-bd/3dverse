import { supabase, isSupabaseConfigured } from '../supabaseClient'
import { SKELETON_CATALOG } from './catalog'

// The builder's catalogue from the database (prices are admin-protected there).
// If the database is not reachable, the approved seed is shown for reading
// only: `live: false` keeps "Add to cart" switched off, so no order can ever be
// priced from this file.
export async function getSkeletonCatalog() {
  if (!isSupabaseConfigured) return { catalog: SKELETON_CATALOG, live: false }
  try {
    const { data, error } = await supabase.rpc('skeleton_catalog')
    if (error || !data?.items?.length) throw new Error(error?.message || 'empty')
    const items = data.items.map((i) => ({ ...i, half_price: Number(i.half_price), full_price: i.full_price === null ? null : Number(i.full_price), weight_kg: Number(i.weight_kg) }))
    const bundles = data.bundles.map((b) => ({ ...b, price: Number(b.price), weight_kg: Number(b.weight_kg) }))
    return { catalog: { items, bundles, sections: SKELETON_CATALOG.sections, context: SKELETON_CATALOG.context }, live: true }
  } catch (e) {
    console.error('skeleton catalog:', e.message)
    return { catalog: SKELETON_CATALOG, live: false }
  }
}
