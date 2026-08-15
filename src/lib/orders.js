import { supabase, isSupabaseConfigured } from './supabaseClient'

// ---- Status vocabularies -------------------------------------------------

// Our internal order lifecycle.
export const ORDER_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'ready', label: 'Ready for delivery' },
  { value: 'sent_to_steadfast', label: 'Sent to Steadfast' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
  { value: 'failed', label: 'Failed' },
]

export function orderStatusLabel(v) {
  return ORDER_STATUSES.find((s) => s.value === v)?.label || v || '—'
}

// Steadfast delivery_status -> friendly label (from their official docs).
export const STEADFAST_STATUS_LABELS = {
  pending: 'Pending',
  in_review: 'In review',
  hold: 'On hold',
  delivered: 'Delivered',
  partial_delivered: 'Partially delivered',
  cancelled: 'Cancelled',
  delivered_approval_pending: 'Delivered (approval pending)',
  partial_delivered_approval_pending: 'Partial (approval pending)',
  cancelled_approval_pending: 'Cancelled (approval pending)',
  unknown_approval_pending: 'Unknown (approval pending)',
  unknown: 'Unknown',
}

export function steadfastStatusLabel(v) {
  if (!v) return 'Not created'
  return STEADFAST_STATUS_LABELS[v] || v
}

// Public customer tracking URL (no secret involved). Configurable via a
// public env var; falls back to Steadfast's tracking page.
export function trackingUrlFor(code) {
  if (!code) return ''
  const base = (process.env.NEXT_PUBLIC_STEADFAST_TRACKING_URL_BASE || 'https://steadfast.com.bd/t').replace(/\/$/, '')
  return `${base}/${code}`
}

// Map a Steadfast delivery_status onto our internal order status (conservative).
export function mapSteadfastToOrderStatus(deliveryStatus) {
  switch (deliveryStatus) {
    case 'delivered':
    case 'partial_delivered':
      return 'delivered'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'shipped' // in_review / pending / hold / approval-pending -> in the courier's hands
  }
}

// ---- Money: one source of truth ------------------------------------------

// COD business model: the customer pays the full total on delivery.
export function computeTotals({ items = [], delivery_charge = 0, discount = 0 }) {
  const subtotal = items.reduce(
    (s, i) => s + (Number(i.unit_price) || 0) * (Number(i.qty) || 0),
    0
  )
  const total = Math.max(0, subtotal + (Number(delivery_charge) || 0) - (Number(discount) || 0))
  return { subtotal, total, cod_amount: total }
}

// ---- Validation ----------------------------------------------------------

// Bangladeshi mobile: 11 digits starting 01 (Steadfast requires exactly 11 digits).
export function normalisePhone(p) {
  return String(p || '').replace(/[\s-]/g, '')
}
export function isValidBDPhone(p) {
  return /^01\d{9}$/.test(normalisePhone(p))
}

export function validateOrderInput({ customer_name, customer_phone, customer_address, items }) {
  const errors = {}
  if (!customer_name || customer_name.trim().length < 2) errors.customer_name = 'Please enter your full name.'
  if (!isValidBDPhone(customer_phone)) errors.customer_phone = 'Enter a valid 11-digit number (e.g. 01712345678).'
  if (!customer_address || customer_address.trim().length < 10) errors.customer_address = 'Enter a full delivery address (area, thana, district).'
  if (!Array.isArray(items) || items.length === 0) errors.items = 'No product selected.'
  else if (items.some((i) => !(Number(i.qty) > 0))) errors.items = 'Quantity must be at least 1.'
  return { ok: Object.keys(errors).length === 0, errors }
}

// ---- Data access ---------------------------------------------------------

// Customer-facing: create an order (anonymous insert allowed by RLS).
export async function createOrder(input) {
  if (!isSupabaseConfigured) return { ok: false, error: 'Ordering is not available right now.' }
  const items = (input.items || []).map((i) => ({
    product_id: String(i.product_id || ''),
    name: i.name || '',
    slug: i.slug || '',
    unit_price: Number(i.unit_price) || 0,
    qty: Math.max(1, Math.round(Number(i.qty) || 1)),
  }))
  const check = validateOrderInput({ ...input, items })
  if (!check.ok) return { ok: false, error: 'Please check the form and try again.', errors: check.errors }

  // Anonymous customers submit through a security-definer RPC (see migration):
  // it computes totals server-side, forces a fresh "new" order, and returns
  // only the order number — the orders table itself is not readable by anon.
  const { data, error } = await supabase.rpc('create_customer_order', {
    p_name: input.customer_name.trim(),
    p_phone: normalisePhone(input.customer_phone),
    p_address: input.customer_address.trim(),
    p_note: (input.note || '').trim(),
    p_items: items,
  })
  if (error) return { ok: false, error: 'Could not place the order. Please try again.' }
  return { ok: true, order_number: data }
}

// Customer checkout: places the order via the security-definer place_order RPC
// (server recomputes all money; COD = product subtotal, delivery prepaid via bKash).
export async function placeOrder({ customer_name, customer_phone, customer_address, note, items, transaction_id }) {
  if (!isSupabaseConfigured) return { ok: false, error: 'Ordering is not available right now.' }
  const check = validateOrderInput({ customer_name, customer_phone, customer_address, items })
  if (!check.ok) return { ok: false, error: 'Please check your details and try again.', errors: check.errors }
  if (!String(transaction_id || '').trim()) return { ok: false, error: 'Enter your bKash transaction ID.' }
  const { data, error } = await supabase.rpc('place_order', {
    p_name: customer_name.trim(),
    p_phone: normalisePhone(customer_phone),
    p_address: customer_address.trim(),
    p_note: (note || '').trim(),
    p_items: items.map((i) => ({ product_id: i.product_id, quantity: Math.max(1, Math.round(Number(i.quantity) || 1)) })),
    p_transaction_id: String(transaction_id).trim(),
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, ...data }
}

// Admin: manually create an order (phone / WhatsApp / walk-in — from outside
// the web). Admin is trusted, so money is computed from the entered lines via
// the same computeTotals source of truth. Items may be catalog products or
// custom off-catalog lines. order_number is generated atomically by the DB
// default (concurrency-safe). If created as "confirmed", the invoice trigger
// fires via a follow-up status update.
export async function adminCreateOrder(input) {
  if (!isSupabaseConfigured) return { ok: false, error: 'Ordering is not available right now.' }
  const items = (input.items || [])
    .map((i) => ({
      product_id: i.product_id || null,
      name: (i.name || '').trim(),
      slug: i.slug || '',
      unit_price: Math.max(0, Number(i.unit_price) || 0),
      qty: Math.max(1, Math.round(Number(i.qty) || 1)),
    }))
    .filter((i) => i.name)
  const check = validateOrderInput({
    customer_name: input.customer_name, customer_phone: input.customer_phone,
    customer_address: input.customer_address, items,
  })
  if (!check.ok) return { ok: false, error: 'Please check the form and try again.', errors: check.errors }

  const delivery_charge = Math.max(0, Number(input.delivery_charge) || 0)
  const discount = Math.max(0, Number(input.discount) || 0)
  const weight_kg = Math.max(0, Number(input.weight_kg) || 0)
  const t = computeTotals({ items, delivery_charge, discount })

  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_name: input.customer_name.trim(),
      customer_phone: normalisePhone(input.customer_phone),
      customer_address: input.customer_address.trim(),
      note: (input.note || '').trim(),
      items,
      subtotal: t.subtotal, delivery_charge, discount, total: t.total, cod_amount: t.cod_amount, weight_kg,
      status: 'new', payment_status: 'pending',
    })
    .select('id, order_number')
    .single()
  if (error) return { ok: false, error: error.message }

  // Best-effort relational mirror + timeline event (non-fatal).
  try {
    await supabase.from('order_items').insert(
      items.map((i) => ({
        order_id: data.id, product_id: i.product_id, product_name_snapshot: i.name,
        unit_price_snapshot: i.unit_price, quantity: i.qty, weight_snapshot: 0,
      }))
    )
  } catch {}
  try {
    await supabase.from('order_events').insert({
      order_id: data.id, type: 'created', message: 'Order added manually by admin.', actor: input.actor || '',
    })
  } catch {}

  // Confirm now (if requested) via a status update so the invoice trigger fires.
  if (input.status === 'confirmed') {
    const up = await supabase.from('orders').update({ status: 'confirmed' }).eq('id', data.id)
    if (up.error) return { ok: true, id: data.id, order_number: data.order_number, warning: 'Order created, but confirming it failed. Confirm it from the order list.' }
  }

  return { ok: true, id: data.id, order_number: data.order_number }
}

// Customer: their own orders (RLS also restricts to auth.uid()).
export async function getMyOrders() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Admin (authenticated) reads/writes.
export async function getOrders(limit = 500) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function getOrder(id) {
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function updateOrder(id, patch) {
  const { error } = await supabase.from('orders').update(patch).eq('id', id)
  if (error) throw error
}

// Hard-delete an order (cascades items/payments/events). Only safe when no
// Steadfast consignment exists — the UI enforces that. Steadfast's API has no
// consignment-delete endpoint, so parcel-linked orders are cancelled instead.
export async function deleteOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}

export async function getOrderEvents(orderId) {
  const { data, error } = await supabase
    .from('order_events')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function addOrderEvent(orderId, { type = 'note', message = '', actor = '' }) {
  const { error } = await supabase.from('order_events').insert({ order_id: orderId, type, message, actor })
  if (error) throw error
}

// ---- Admin: bKash delivery-payment verification -------------------------
export async function getDeliveryPayment(orderId) {
  const { data, error } = await supabase
    .from('delivery_payments').select('*').eq('order_id', orderId)
    .order('submitted_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function verifyDeliveryPayment(orderId, adminEmail = '') {
  const now = new Date().toISOString()
  const a = await supabase.from('delivery_payments').update({ status: 'verified', verified_at: now, verified_by: adminEmail }).eq('order_id', orderId)
  if (a.error) throw a.error
  const b = await supabase.from('orders').update({ payment_status: 'verified', status: 'confirmed' }).eq('id', orderId)
  if (b.error) throw b.error
  await supabase.from('order_events').insert({ order_id: orderId, type: 'status', message: 'Delivery payment verified - order confirmed.', actor: adminEmail })
}

export async function rejectDeliveryPayment(orderId, reason = '', adminEmail = '') {
  const now = new Date().toISOString()
  const a = await supabase.from('delivery_payments').update({ status: 'rejected', verified_at: now, verified_by: adminEmail, rejection_reason: reason }).eq('order_id', orderId)
  if (a.error) throw a.error
  const b = await supabase.from('orders').update({ payment_status: 'rejected' }).eq('id', orderId)
  if (b.error) throw b.error
  await supabase.from('order_events').insert({ order_id: orderId, type: 'status', message: 'Delivery payment rejected' + (reason ? `: ${reason}` : ''), actor: adminEmail })
}
