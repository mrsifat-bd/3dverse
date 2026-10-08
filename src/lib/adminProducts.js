import { supabase } from './supabaseClient'
import { compressImage } from './imageCompress'
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

// Accepted product image formats. This is only a first, friendly check in the
// browser: the server (/api/admin/product-images) inspects the real file bytes
// and is the authority on what is accepted.
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXT = /\.(jpe?g|png|webp)$/i
// Largest original the admin can pick. Files over the server's request limit
// are shrunk in the browser for TRANSPORT only, then fully re-processed on the
// server; this cap just stops absurd files before any work is done.
export const MAX_INPUT_IMAGE_BYTES = 30 * 1024 * 1024 // 30 MB
// Must match MAX_UPLOAD_BYTES on the server (Vercel caps bodies at 4.5 MB).
export const MAX_REQUEST_IMAGE_BYTES = 4 * 1024 * 1024

export function isAcceptedImageFile(f) {
  if (!f) return false
  // Some systems report an empty type for .webp; fall back to the extension.
  return ACCEPTED_IMAGE_TYPES.includes(f.type) || (!f.type && ACCEPTED_EXT.test(f.name || ''))
}

// Uploads one product photo through the server pipeline, which validates it,
// converts it to a metadata-free WebP and stores only the processed file.
// Resolves to { url, width, height, bytes, duplicate, ... }.
//   onProgress(0..1) — bytes sent; onStage('preparing'|'uploading'|'processing')
export async function uploadImage(original, { onProgress, onStage } = {}) {
  if (!isAcceptedImageFile(original)) {
    throw new Error('Unsupported file type. Please use a JPG, PNG or WebP image.')
  }
  if (original.size > MAX_INPUT_IMAGE_BYTES) {
    throw new Error('Image is too large. Please use a file under 30 MB.')
  }

  let file = original
  if (file.size > MAX_REQUEST_IMAGE_BYTES) {
    // Too big to send in one request: make a high-quality smaller copy first.
    // The server still decodes, validates and re-encodes it from scratch.
    onStage?.('preparing')
    file = await compressImage(original, { maxDim: 2600, quality: 0.92 })
    if (file.size > MAX_REQUEST_IMAGE_BYTES) {
      file = await compressImage(original, { maxDim: 2000, quality: 0.88 })
    }
    if (file.size > MAX_REQUEST_IMAGE_BYTES) {
      throw new Error('This photo is too large to upload, even after resizing. Please use a smaller image.')
    }
  }

  const { data: sess } = await supabase.auth.getSession()
  const token = sess?.session?.access_token
  if (!token) throw new Error('Your admin session has expired. Please sign in again.')

  const body = new FormData()
  body.append('file', file, file.name || 'image')

  onStage?.('uploading')
  const res = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/product-images')
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.responseType = 'json'
    xhr.timeout = 60000
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total)
    }
    xhr.upload.onload = () => { onProgress?.(1); onStage?.('processing') }
    xhr.onload = () => resolve({ status: xhr.status, data: xhr.response })
    xhr.onerror = () => reject(new Error('Network error while uploading. Check your connection and try again.'))
    xhr.ontimeout = () => reject(new Error('The upload timed out. Please try again.'))
    xhr.send(body)
  })

  const data = res.data || {}
  if (res.status === 401) throw new Error('Your admin session has expired. Please sign in again.')
  if (res.status < 200 || res.status >= 300 || !data.url) {
    throw new Error(data.error || `Upload failed (error ${res.status}). Please try again.`)
  }
  return data
}
