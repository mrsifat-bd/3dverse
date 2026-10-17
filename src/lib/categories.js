import { supabase, isSupabaseConfigured } from './supabaseClient'
import { CATEGORIES as FALLBACK } from './config'

// Public: active categories from the DB, ordered by how many active products
// each has (most first; name A→Z as a stable tie-breaker). Counting is done in
// the database (aggregate RPC) so we never pull the whole catalog to the client.
// Falls back to a plain sort, then the built-in list, if anything is unavailable.
export async function getPublicCategories() {
  if (!isSupabaseConfigured) return FALLBACK
  try {
    const { data, error } = await supabase.rpc('public_categories_ranked')
    if (!error && Array.isArray(data) && data.length) return data
  } catch {}
  try {
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, blurb, status, sort')
      .eq('status', 'active')
      .order('sort', { ascending: true })
      .order('name', { ascending: true })
    if (Array.isArray(data) && data.length) return data
  } catch {}
  return FALLBACK
}

// { slug: name } for every active category — used to label product cards.
export async function getCategoryNames() {
  const cats = await getPublicCategories()
  return Object.fromEntries(cats.map((c) => [c.slug, c.name]))
}

// Categories that actually have products (the DB ranking gives a count; the
// built-in fallback list has none, so it is kept as-is). Empty categories are
// left out of the homepage, footer and sitemap so nobody lands on a blank page.
export function nonEmptyCategories(cats = []) {
  return cats.filter((c) => c.product_count == null || Number(c.product_count) > 0)
}

export async function getCategoryBySlug(slug) {
  const cats = await getPublicCategories()
  return cats.find((c) => c.slug === slug) || null
}

// Admin CRUD (authenticated + is_admin enforced by RLS).
export async function getAllCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('sort').order('name')
  if (error) throw error
  return data || []
}

export async function createCategory({ name, slug, blurb = '', status = 'active', sort = 0 }) {
  const { error } = await supabase.from('categories').insert({ name: name.trim(), slug: slug.trim(), blurb: blurb.trim(), status, sort })
  if (error) throw error
}

export async function updateCategory(id, patch) {
  const { error } = await supabase.from('categories').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
