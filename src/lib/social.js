import { supabase } from './supabaseClient'

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
  const { data: { user } } = await supabase.auth.getUser()
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
  const { data: { user } } = await supabase.auth.getUser()
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
  const { data, error } = await supabase
    .from('comments')
    .select('id, user_name, comment, created_at')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function submitReview(productId, comment, userName) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('LOGIN_REQUIRED')
  const text = String(comment || '').trim()
  if (text.length < 3) throw new Error('Please write a bit more.')
  const { error } = await supabase.from('comments').insert({
    user_id: user.id, product_id: productId, comment: text.slice(0, 1000),
    user_name: (userName || '').trim() || (user.email || '').split('@')[0], status: 'pending',
  })
  if (error) throw error
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
