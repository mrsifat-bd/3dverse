import { supabase, PRODUCTS_BUCKET } from './supabaseClient'
import { slugify } from './format'

// Admin CRUD + image upload. All calls require an authenticated session;
// RLS on the server enforces that anonymous users cannot write.

// Admin reads go through security-definer RPCs (gated by is_admin) so the
// internal production_cost is returned to admins only. Customers calling these
// RPCs get an exception; they can never read production_cost via the table
// either (SELECT on that column is revoked from the authenticated role).
export async function listProducts() {
  const { data, error } = await supabase.rpc('admin_products')
  if (error) throw error
  return data || []
}

export async function getProduct(id) {
  const { data, error } = await supabase.rpc('admin_product', { p_id: id })
  if (error) throw error
  return Array.isArray(data) ? data[0] || null : data || null
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
    is_popular: Boolean(payload.is_popular),
    weight_kg: payload.weight_kg === '' || payload.weight_kg == null ? 0.5 : Number(payload.weight_kg),
    discount_percent: Math.max(0, Math.min(99, Math.round(Number(payload.discount_percent) || 0))),
    review_url: payload.review_url?.trim() || '',
    extra_link: payload.extra_link?.trim() || '',
    extra_link_label: payload.extra_link_label?.trim() || '',
    // Internal, admin-only. The private link to the source 3D model file, for
    // the admin to download later and print. Never exposed to the public.
    model_source_url: payload.model_source_url?.trim() || '',
    faqs: Array.isArray(payload.faqs)
      ? payload.faqs
          .filter((f) => f && (f.q || '').trim())
          .map((f) => ({ q: (f.q || '').trim(), a: (f.a || '').trim() }))
      : [],
    // Internal, admin-only. Written under the authenticated role; never exposed publicly.
    production_cost:
      payload.production_cost === '' || payload.production_cost == null
        ? null
        : Number(payload.production_cost),
  }
}

// Best-effort: ask the server to revalidate the customer-facing product pages
// so a newly created/edited product + image appear immediately (instead of
// after the 60s ISR window). Never blocks or fails the write.
async function pingRevalidate() {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
  } catch {}
}

// Writes return only `id`: after the production_cost lockdown the authenticated
// role has no SELECT on that column, so a full `.select()` representation would
// be denied. The admin form only needs to know the write succeeded.
export async function createProduct(payload) {
  const { data, error } = await supabase.from('products').insert(normalise(payload)).select('id').single()
  if (error) throw error
  await pingRevalidate()
  return data
}

export async function updateProduct(id, payload) {
  const { data, error } = await supabase.from('products').update(normalise(payload)).eq('id', id).select('id').single()
  if (error) throw error
  await pingRevalidate()
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
  await pingRevalidate()
}

// Accepted product image formats + size cap. Exported so the form validates
// with the exact same rules the upload enforces. The Supabase bucket is ALSO
// configured with these limits (allowed_mime_types + file_size_limit), so a
// bad file is rejected server-side even if the client checks were bypassed.
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8 MB
const EXT_BY_TYPE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

// Uploads a File to the product-images bucket and returns its public URL.
// Validates type + size first, and stores the correct Content-Type so the CDN
// serves it as an image.
export async function uploadImage(file) {
  if (!file || !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type. Please use a JPG, PNG or WebP image.')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large. Please use a file under 8 MB.')
  }
  const ext = EXT_BY_TYPE[file.type] || (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(PRODUCTS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })
  if (error) throw error
  const { data } = supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
