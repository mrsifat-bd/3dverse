import { supabase } from './supabaseClient'
import { firstImage, effectivePrice } from './format'

// A cart line is enriched for display:
// { product_id, name, slug, price, image, weight_kg, in_stock, quantity }

const GUEST_KEY = '3dv_cart'
const PRODUCT_COLS = 'id,name,slug,price,discount_percent,image_url,weight_kg,in_stock'

export function enrichLine(p, quantity) {
  return {
    product_id: p.id,
    name: p.name,
    slug: p.slug,
    price: effectivePrice(p),
    image: firstImage(p),
    weight_kg: Number(p.weight_kg) || 0,
    in_stock: p.in_stock !== false,
    quantity: Math.max(1, Math.round(Number(quantity) || 1)),
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
  const q = Math.max(1, Math.round(Number(quantity) || 1))
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
  const q = (existing?.quantity || 0) + Math.max(1, Math.round(Number(addQty) || 1))
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
}

// Merge a guest cart into the logged-in cart (adds quantities).
export async function dbMergeGuest(guestLines) {
  for (const line of guestLines || []) {
    try { await dbAdd(line.product_id, line.quantity) } catch {}
  }
}

// ---- Totals -------------------------------------------------------------
export function cartTotals(lines) {
  const subtotal = lines.reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.quantity) || 0), 0)
  const weight = lines.reduce((w, l) => w + (Number(l.weight_kg) || 0) * (Number(l.quantity) || 0), 0)
  const count = lines.reduce((c, l) => c + (Number(l.quantity) || 0), 0)
  return { subtotal, weight, count }
}
