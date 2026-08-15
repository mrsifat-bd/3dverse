import { supabase } from './supabaseClient'
import { BUSINESS, SITE_URL } from './config'

// Brand block shown on every invoice. Uses existing business info only — no
// invented phone/email/address. Tagline + website per the invoice spec.
export const INVOICE_BRAND = {
  name: '3D Verse',
  legalName: '3D Verse BD',
  tagline: 'Dream. Design. Deliver.',
  website: (SITE_URL || 'https://3dversebd.com').replace(/\/$/, ''),
  email: BUSINESS.email,
  phone: BUSINESS.phone,
  location: BUSINESS.location,
}

// Payment vocab — only methods the business actually supports.
export const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid', color: '#9A6A62' },
  { value: 'partial', label: 'Partial', color: '#C99A4E' },
  { value: 'paid', label: 'Paid', color: '#5B8A5B' },
  { value: 'refunded', label: 'Refunded', color: '#8A8577' },
]
export const PAYMENT_METHODS = [
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
]
export function paymentStatusLabel(v) {
  return PAYMENT_STATUSES.find((s) => s.value === v)?.label || 'Unpaid'
}
export function paymentStatusColor(v) {
  return PAYMENT_STATUSES.find((s) => s.value === v)?.color || '#9A6A62'
}
export function paymentMethodLabel(v) {
  return PAYMENT_METHODS.find((m) => m.value === v)?.label || 'Other'
}

// Derived money for display. Total is stored frozen on the invoice; due is
// total minus the (manually entered) paid amount.
export function invoiceMoney(inv) {
  const subtotal = Number(inv?.subtotal) || 0
  const delivery = Number(inv?.delivery_charge) || 0
  const discount = Number(inv?.discount) || 0
  const total = Number(inv?.total) || Math.max(0, subtotal + delivery - discount)
  const paid = Math.max(0, Number(inv?.paid_amount) || 0)
  const due = Math.max(0, total - paid)
  return { subtotal, delivery, discount, total, paid, due }
}

// Line items from the frozen snapshot (never re-priced from live products).
export function invoiceItems(inv) {
  const items = Array.isArray(inv?.items) ? inv.items : []
  return items.map((i) => {
    const qty = Math.max(1, Math.round(Number(i.qty ?? i.quantity) || 1))
    const unit = Number(i.unit_price ?? i.unit_price_snapshot) || 0
    return { name: i.name || i.product_name_snapshot || 'Item', qty, unit, total: unit * qty }
  })
}

// "15 August 2026" in the business timezone (Asia/Dhaka).
export function formatInvoiceDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return ''
  }
}

// ---- Data access (admin + owner via RLS) --------------------------------
export async function getInvoiceByOrder(orderId) {
  const { data, error } = await supabase.from('invoices').select('*').eq('order_id', orderId).maybeSingle()
  if (error) throw error
  return data
}

export async function updateInvoicePayment(invoiceId, { payment_status, payment_method, paid_amount }) {
  const patch = {}
  if (payment_status !== undefined) patch.payment_status = payment_status
  if (payment_method !== undefined) patch.payment_method = payment_method
  if (paid_amount !== undefined) patch.paid_amount = Math.max(0, Number(paid_amount) || 0)
  const { error } = await supabase.from('invoices').update(patch).eq('id', invoiceId)
  if (error) throw error
}

// Explicit generation for an already-confirmed order (fallback; the DB trigger
// normally creates the invoice automatically on confirm).
export async function generateInvoiceForOrder(orderId) {
  const { data, error } = await supabase.rpc('admin_generate_invoice', { p_order_id: orderId })
  if (error) throw error
  return data
}
