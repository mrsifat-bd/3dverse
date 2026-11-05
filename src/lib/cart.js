import { supabase } from './supabaseClient'
import { firstImage, effectivePrice } from './format'

// A cart line is enriched for display:
// { product_id, name, slug, price, image, weight_kg, in_stock, quantity }

// Same ceiling as the database (place_order): any whole number 1..1000 per
// product. It is an anti-abuse limit, not a business rule; larger orders go
// through WhatsApp / contact.
export const MAX_QTY = 1000
export const clampQty = (q) => Math.min(MAX_QTY, Math.max(1, Math.round(Number(q) || 1)))

const GUEST_KEY = '3dv_cart'
const PRODUCT_COLS = 'id,name,name_bn,slug,price,discount_percent,image_url,weight_kg,in_stock'

export function enrichLine(p, quantity) {
  return {
    product_id: p.id,
    name: p.name,
    name_bn: p.name_bn || null,
    slug: p.slug,
    price: effectivePrice(p),
    image: firstImage(p),
    weight_kg: Number(p.weight_kg) || 0,
    in_stock: p.in_stock !== false,
    quantity: clampQty(quantity),
  }
}

// ---- Guest cart (localStorage) ------------------------------------------
export function readGuestCart() {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(GUEST_KEY) || '[]') } catch { return [] }
}
export function writeGuestCart(lines) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(lines)) } catch {}
}
export function clearGuestCart() {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(GUEST_KEY) } catch {}
}

// ---- Logged-in cart (Supabase) ------------------------------------------
export async function dbGetCart() {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`product_id, quantity, products(${PRODUCT_COLS})`)
    .order('created_at')
  if (error) throw error
  return (data || []).filter((r) => r.products).map((r) => enrichLine(r.products, r.quantity))
}

export async function dbSetQty(productId, quantity) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  const q = clampQty(quantity)
  const { error } = await supabase
    .from('cart_items')
    .upsert({ user_id: user.id, product_id: productId, quantity: q }, { onConflict: 'user_id,product_id' })
  if (error) throw error
}

export async function dbAdd(productId, addQty = 1) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  const { data: existing } = await supabase
    .from('cart_items').select('quantity').eq('user_id', user.id).eq('product_id', productId).maybeSingle()
  const q = clampQty((existing?.quantity || 0) + clampQty(addQty))
  const { error } = await supabase
    .from('cart_items')
    .upsert({ user_id: user.id, product_id: productId, quantity: q }, { onConflict: 'user_id,product_id' })
  if (error) throw error
}

export async function dbRemove(productId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', productId)
  if (error) throw error
}

export async function dbClear() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('cart_items').delete().eq('user_id', user.id)
  await supabase.from('skeleton_carts').delete().eq('user_id', user.id)
}

// Merge a guest cart into the logged-in cart (adds quantities).
export async function dbMergeGuest(guestLines) {
  for (const line of guestLines || []) {
    try {
      if (isSkeletonLine(line)) await dbSetSkeleton(line.config)
      else await dbAdd(line.product_id, line.quantity)
    } catch {}
  }
}

// ---- Totals -------------------------------------------------------------
export function cartTotals(lines) {
  const subtotal = lines.reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.quantity) || 0), 0)
  const weight = lines.reduce((w, l) => w + (Number(l.weight_kg) || 0) * (Number(l.quantity) || 0), 0)
  const count = lines.reduce((c, l) => c + (Number(l.quantity) || 0), 0)
  return { subtotal, weight, count }
}

// ---- Interactive Skeleton Builder line ------------------------------------
// One builder configuration per cart. Its price is NEVER taken from the
// browser: it always comes from the database function skeleton_quote(), and
// checkout re-prices it again inside place_order().
export const SKELETON_LINE_ID = 'skeleton-builder'
const SKELETON_IMAGE = '/models/skeleton-front.webp'

export function isSkeletonLine(l) {
  return l?.kind === 'skeleton' || l?.product_id === SKELETON_LINE_ID
}

export async function serverSkeletonQuote(config) {
  if (!supabase) return { ok: false, error: 'not_configured' }
  const { data, error } = await supabase.rpc('skeleton_quote', { p_config: { pieces: config?.pieces || [] } })
  if (error) return { ok: false, error: error.message }
  return data || { ok: false, error: 'no_quote' }
}

export function skeletonLine(config, q) {
  const set = q?.set
  return {
    product_id: SKELETON_LINE_ID,
    kind: 'skeleton',
    name: 'Interactive Skeleton Builder' + (set === 'full' ? ' — Complete Full Set' : set === 'half' ? ' — Complete Half Set' : ''),
    name_bn: 'ইন্টারঅ্যাক্টিভ স্কেলেটন বিল্ডার' + (set === 'full' ? ' — কমপ্লিট ফুল সেট' : set === 'half' ? ' — কমপ্লিট হাফ সেট' : ''),
    slug: null,
    href: '/skeleton-builder',
    image: SKELETON_IMAGE,
    price: q?.ok ? Number(q.total) || 0 : 0,
    weight_kg: q?.ok ? Number(q.weight_kg) || 0 : 0,
    in_stock: true,
    quantity: 1,
    valid: Boolean(q?.ok && Number(q.total) > 0),
    config: { pieces: config?.pieces || [] },
    quote: q?.ok ? q : null,
  }
}

// Re-price a stored builder line (guest carts store only the configuration).
export async function refreshSkeletonLine(line) {
  return skeletonLine(line.config, await serverSkeletonQuote(line.config))
}

export async function dbGetSkeleton() {
  const { data, error } = await supabase.from('skeleton_carts').select('config').maybeSingle()
  if (error || !data) return null
  return refreshSkeletonLine({ config: data.config })
}

export async function dbSetSkeleton(config) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  const { error } = await supabase.from('skeleton_carts')
    .upsert({ user_id: user.id, config: { pieces: config?.pieces || [] }, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function dbClearSkeleton() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('skeleton_carts').delete().eq('user_id', user.id)
}
