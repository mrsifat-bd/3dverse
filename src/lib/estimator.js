import { supabase, isSupabaseConfigured } from './supabaseClient'

// Original defaults from the Cost Estimator spec. Used as a fallback and as
// the seed for the admin_settings row. Admins can edit + persist these.
export const ESTIMATOR_DEFAULTS = {
  filamentCostPerKg: 1700, // BDT per kg
  labourPercent: 15, // % of base cost
  profitMargin: 60, // % of making cost
  electricityRate: 16, // BDT per unit (kWh)
  printerWattage: 500, // Watts
  machineRatePerHour: 20, // BDT per billable hour
  freeHours: 1.5, // hours billed free before machine cost applies
}

// Only these keys are accepted from storage; everything else falls back.
function sanitize(cfg) {
  const out = { ...ESTIMATOR_DEFAULTS }
  if (cfg && typeof cfg === 'object') {
    for (const k of Object.keys(ESTIMATOR_DEFAULTS)) {
      const v = Number(cfg[k])
      if (Number.isFinite(v)) out[k] = v
    }
  }
  return out
}

// Pure calculation — mirrors the estimator spec exactly. All money in BDT.
// inputs: { filamentGrams, printHours, printMinutes, machineCostEnabled }
// config: the ESTIMATOR_DEFAULTS shape (persisted admin defaults).
export function computeEstimate(inputs, config = ESTIMATOR_DEFAULTS) {
  const c = sanitize(config)
  const consumption = Number(inputs.filamentGrams) || 0
  const durationHours = Number(inputs.printHours) || 0
  const durationMinutes = Number(inputs.printMinutes) || 0

  const filament = (consumption / 1000) * c.filamentCostPerKg
  const totalHours = durationHours + durationMinutes / 60
  const electricity = (c.printerWattage / 1000) * totalHours * c.electricityRate

  const billableHours = Math.max(0, totalHours - c.freeHours)
  const machine = inputs.machineCostEnabled ? Math.ceil(billableHours) * c.machineRatePerHour : 0

  const base = filament + electricity // filament + electricity
  const labour = base * (c.labourPercent / 100) // labour is a % of BASE
  const production = base + labour // "Making Cost" — machine cost EXCLUDED
  const profit = production * (c.profitMargin / 100) // margin applies to making cost only
  const selling = production + profit + machine // machine cost added AFTER profit

  return { filament, electricity, machine, base, labour, production, profit, selling, totalHours }
}

// Total print time in minutes — used for the auto machine-cost rule.
export function totalMinutes(printHours, printMinutes) {
  return (Number(printHours) || 0) * 60 + (Number(printMinutes) || 0)
}

// Reads the admin defaults (admin session required by RLS). Falls back to the
// original defaults when Supabase is not configured or the row is missing.
export async function getEstimatorDefaults() {
  if (!isSupabaseConfigured) return { ...ESTIMATOR_DEFAULTS }
  try {
    const { data, error } = await supabase.from('admin_settings').select('estimator').eq('id', 1).maybeSingle()
    if (error || !data) return { ...ESTIMATOR_DEFAULTS }
    return sanitize(data.estimator)
  } catch {
    return { ...ESTIMATOR_DEFAULTS }
  }
}

// Persists new admin defaults (admin-only via RLS). Only known numeric keys are stored.
export async function saveEstimatorDefaults(config) {
  const clean = sanitize(config)
  const { error } = await supabase
    .from('admin_settings')
    .upsert({ id: 1, estimator: clean, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) throw error
  return clean
}
