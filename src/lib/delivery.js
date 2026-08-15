import { supabase } from './supabaseClient'

// Single source of truth for delivery-charge logic (mirrors the server tiers in
// migration_ecommerce.sql -> compute_delivery_charge). The SERVER value is
// authoritative for real orders; this local mirror is only for instant UI.

export const DEFAULT_DELIVERY_CHARGE = 120

// Total parcel weight (kg) for a set of cart lines.
export function totalWeight(items = []) {
  return items.reduce(
    (w, i) => w + (Number(i.weight_kg ?? i.weight_snapshot ?? 0) || 0) * (Number(i.quantity ?? i.qty ?? 0) || 0),
    0
  )
}

// Local mirror of the tier rules: <=1kg ৳120, <=2kg ৳210, <=3kg ৳240, then +৳30/kg.
export function localDeliveryCharge(weightKg) {
  const w = Number(weightKg) || 0
  if (w <= 1) return 120
  if (w <= 2) return 210
  if (w <= 3) return 240
  return 240 + Math.ceil(w - 3) * 30
}

// Authoritative charge from the database function (falls back to local mirror).
export async function serverDeliveryCharge(weightKg) {
  try {
    const { data, error } = await supabase.rpc('compute_delivery_charge', { p_weight: Number(weightKg) || 0 })
    if (!error && data != null) return Number(data)
  } catch {}
  return localDeliveryCharge(weightKg)
}
