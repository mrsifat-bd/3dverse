import { supabase, PRODUCTS_BUCKET } from './supabaseClient'
import { slugify } from './format'

// Admin CRUD + image upload. All calls require an authenticated session;
// RLS on the server enforces that anonymous users cannot write.

export async function listProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getProduct(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

function normalise(payload) {
  return {
    name: payload.name?.trim(),
    slug: (payload.slug?.trim() || slugify(payload.name || '')),
    price: Number(payload.price) || 0,
    description: payload.description?.trim() || '',
    category: payload.category || 'miscellaneous',
    tags: Array.isArray(payload.tags)
      ? payload.tags
      : String(payload.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
    image_url: Array.isArray(payload.image_url) ? payload.image_url : [],
    in_stock: Boolean(payload.in_stock),
  }
}

export async function createProduct(payload) {
  const { data, error } = await supabase.from('products').insert(normalise(payload)).select().single()
  if (error) throw error
  return data
}

export async function updateProduct(id, payload) {
  const { data, error } = await supabase.from('products').update(normalise(payload)).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// Uploads a File to the product-images bucket and returns its public URL.
export async function uploadImage(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(PRODUCTS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
