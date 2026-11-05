// Admin data access for the Skeleton Builder. Every call runs as the signed-in
// admin; the database checks is_admin() on the server (RLS + security-definer
// functions). Prices and set contents can only change through the logged
// functions admin_skeleton_set_price / admin_skeleton_set_bundle_item.
import { supabase } from '../supabaseClient'
import { indexCatalog, setSaving } from './pricing'

export async function getAdminSkeleton() {
  const { data, error } = await supabase.rpc('skeleton_catalog')
  if (error) throw new Error(/skeleton_catalog/.test(error.message) ? 'The Skeleton Builder tables are not installed yet (migration_skeleton_1_tables.sql).' : error.message)
  const items = (data?.items || []).map((i) => ({ ...i, half_price: Number(i.half_price), full_price: i.full_price === null ? null : Number(i.full_price), weight_kg: Number(i.weight_kg) }))
  const bundles = (data?.bundles || []).map((b) => ({ ...b, price: Number(b.price), weight_kg: Number(b.weight_kg) }))
  return { items, bundles }
}

const META_FIELDS = ['name_en', 'name_bn', 'grp', 'note_en', 'note_bn', 'is_active', 'is_available', 'sort', 'meshes', 'aliases']
export async function updateItemMeta(key, patch) {
  const row = Object.fromEntries(Object.entries(patch).filter(([k]) => META_FIELDS.includes(k)))
  const { error } = await supabase.from('skeleton_items').update(row).eq('key', key).select('key').single()
  if (error) throw new Error(error.message)
}

export async function updateBundleMeta(key, patch) {
  const row = Object.fromEntries(Object.entries(patch).filter(([k]) => ['name_en', 'name_bn', 'is_active', 'sort'].includes(k)))
  const { error } = await supabase.from('skeleton_bundles').update(row).eq('key', key).select('key').single()
  if (error) throw new Error(error.message)
}

export async function setPrice(what, key, half, full, reason) {
  const { error } = await supabase.rpc('admin_skeleton_set_price', { p_what: what, p_key: key, p_half: half, p_full: full, p_reason: reason })
  if (error) throw new Error(error.message)
}

export async function setBundleItem(bundle, item, include, mode, qty, reason) {
  const { error } = await supabase.rpc('admin_skeleton_set_bundle_item', { p_bundle: bundle, p_item: item, p_include: include, p_mode: mode, p_qty: qty, p_reason: reason })
  if (error) throw new Error(error.message)
}

export async function getChangeLog(limit = 30) {
  const { data, error } = await supabase.from('skeleton_change_log').select('*').order('changed_at', { ascending: false }).limit(limit)
  if (error) return []
  return data || []
}

// Checks shown before/after a price change (safeguards S2 and S6).
export function catalogWarnings(catalog) {
  const out = []
  const idx = indexCatalog(catalog)
  for (const i of catalog.items) {
    if (i.kind === 'paired' && !(Number(i.full_price) > Number(i.half_price))) out.push(`${i.name_en}: the pair price (${i.full_price}) is not above one side (${i.half_price}) — the builder will price two sides as two singles.`)
  }
  const half = idx.bundles.half; const full = idx.bundles.full
  if (half && setSaving(idx, half) <= 0) out.push('Half Set price is not below its bones at normal prices — the set price will not be applied.')
  if (full && setSaving(idx, full) <= 0) out.push('Full Set price is not below its bones at normal prices — the set price will not be applied.')
  if (half && full && setSaving(idx, half) > setSaving(idx, full)) out.push('The Half Set saves more than the Full Set — customers could build a near-Full Set for less via the Half Set.')
  return out
}
