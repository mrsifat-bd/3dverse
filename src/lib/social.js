import { supabase } from './supabaseClient'

// Read-only lookups only need the signed-in user's id, which the browser
// already has in its session. getSession() is local (no network round trip);
// getUser() re-validates the token with the auth server and is kept for
// writes. Row-level security still decides what each user can read.
async function sessionUser() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user || null
}

const PRODUCT_COLS = 'id,name,slug,price,discount_percent,image_url,weight_kg,in_stock,category'

// ---- Likes --------------------------------------------------------------
export async function getLikeCount(productId) {
  const { count } = await supabase
    .from('product_likes')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)
  return count || 0
}

export async function hasLiked(productId) {
  const user = await sessionUser()
  if (!user) return false
  const { data } = await supabase.from('product_likes').select('id').eq('user_id', user.id).eq('product_id', productId).maybeSingle()
  return !!data
}

export async function toggleLike(productId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('LOGIN_REQUIRED')
  const liked = await hasLiked(productId)
  if (liked) {
    await supabase.from('product_likes').delete().eq('user_id', user.id).eq('product_id', productId)
    return false
  }
  await supabase.from('product_likes').insert({ user_id: user.id, product_id: productId })
  return true
}

// ---- Wishlist -----------------------------------------------------------
export async function isWishlisted(productId) {
  const user = await sessionUser()
  if (!user) return false
  const { data } = await supabase.from('wishlists').select('id').eq('user_id', user.id).eq('product_id', productId).maybeSingle()
  return !!data
}

export async function toggleWishlist(productId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('LOGIN_REQUIRED')
  const saved = await isWishlisted(productId)
  if (saved) {
    await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId)
    return false
  }
  await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId })
  return true
}

// ---- Reviews / comments -------------------------------------------------
export async function getReviews(productId) {
  const q = (cols) => supabase
    .from('comments')
    .select(cols)
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  let { data, error } = await q('id, user_name, comment, created_at, rating, photo_url, verified')
  if (error) ({ data, error } = await q('id, user_name, comment, created_at')) // before the ratings migration
  if (error) throw error
  return data || []
}

// rating: 1–5 (required). photoUrl: optional, from /api/review-photos.
// "verified" is set by the database (verified buyer), never by the browser.
export async function submitReview(productId, comment, userName, rating, photoUrl = '') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('LOGIN_REQUIRED')
  const text = String(comment || '').trim()
  const stars = Math.round(Number(rating))
  if (!(stars >= 1 && stars <= 5)) throw new Error('Please choose a star rating.')
  if (text.length < 3) throw new Error('Please write a bit more.')
  const { error } = await supabase.from('comments').insert({
    user_id: user.id, product_id: productId, comment: text.slice(0, 1000), rating: stars,
    photo_url: photoUrl || '',
    user_name: (userName || '').trim() || (user.email || '').split('@')[0], status: 'pending',
  })
  if (error) throw error
}

// Uploads a customer's review photo through the server pipeline (validated,
// converted to WebP, metadata stripped). Returns the public URL.
export async function uploadReviewPhoto(file) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('LOGIN_REQUIRED')
  // Phone photos are often 5–10 MB; send a 1600px copy (the server re-checks
  // and re-encodes it anyway).
  const { compressImage } = await import('./imageCompress')
  const small = await compressImage(file, { maxDim: 1600, quality: 0.88 })
  const body = new FormData()
  body.append('file', small)
  const res = await fetch('/api/review-photos', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'The photo could not be uploaded.')
  return json.url
}

// Admin moderation.
export async function getAllComments() {
  const { data, error } = await supabase
    .from('comments')
    .select('*, products(name, slug)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function moderateComment(id, status, adminEmail = '') {
  const { error } = await supabase
    .from('comments')
    .update({ status, approved_at: new Date().toISOString(), approved_by: adminEmail })
    .eq('id', id)
  if (error) throw error
}

export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
}

export async function getWishlist() {
  const { data, error } = await supabase
    .from('wishlists')
    .select(`product_id, products(${PRODUCT_COLS})`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((r) => r.products).filter(Boolean)
}
