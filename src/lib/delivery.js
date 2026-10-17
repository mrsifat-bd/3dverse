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

// Sylhet city (cheaper courier zone). Matches public.is_sylhet_city() in
// migration_audit_fixes.sql — police-station labels are "Thana, District".
const SYLHET_CITY = new Set(['sylhet sadar, sylhet', 'dakshinsurma, sylhet'])
export function isSylhetCity(policeStation) {
  return SYLHET_CITY.has(String(policeStation || '').trim().toLowerCase())
}

// Local mirror of the tier rules (server: compute_delivery_charge_zone).
//   Rest of Bangladesh: <=1kg ৳120, <=2kg ৳210, <=3kg ৳240, then +৳30/kg.
//   Sylhet city:        ৳50 less on each tier (৳70 / ৳160 / ৳190).
// Without a police station yet, the outside-Sylhet price is shown.
export function localDeliveryCharge(weightKg, policeStation) {
  const w = Number(weightKg) || 0
  const off = isSylhetCity(policeStation) ? 50 : 0
  if (w <= 1) return 120 - off
  if (w <= 2) return 210 - off
  if (w <= 3) return 240 - off
  return 240 - off + Math.ceil(w - 3) * 30
}

// Authoritative charge from the database function (falls back to local mirror).
export async function serverDeliveryCharge(weightKg, policeStation = '') {
  try {
    const { data, error } = await supabase.rpc('compute_delivery_charge_zone', { p_weight: Number(weightKg) || 0, p_police_station: policeStation || '' })
    if (!error && data != null) return Number(data)
  } catch {}
  return localDeliveryCharge(weightKg, policeStation)
}
