import { supabase, isSupabaseConfigured } from './supabaseClient'
import { CATEGORIES as FALLBACK } from './config'

// Public: active categories from the DB, ordered. Falls back to the built-in
// list if the DB is unavailable or the categories migration hasn't been run.
export async function getPublicCategories() {
  if (!isSupabaseConfigured) return FALLBACK
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, blurb, status, sort')
      .eq('status', 'active')
      .order('sort', { ascending: true })
      .order('name', { ascending: true })
    if (error || !data || !data.length) return FALLBACK
    return data
  } catch {
    return FALLBACK
  }
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
