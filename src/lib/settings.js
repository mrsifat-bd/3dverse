import { supabase, isSupabaseConfigured } from './supabaseClient'
import { BUSINESS, REVIEW_URL } from './config'

// Default settings (fallback when Supabase is not configured or a field is blank).
export const DEFAULT_SETTINGS = {
  business_name: BUSINESS.name,
  owner: BUSINESS.owner,
  location: BUSINESS.location,
  email: BUSINESS.email,
  phone: BUSINESS.phone,
  whatsapp_number: BUSINESS.whatsappNumber,
  tagline: BUSINESS.tagline,
  description: BUSINESS.description,
  hero_headline: 'Custom 3D printed products, made for you.',
  hero_subtext:
    'Anatomical models, personalised keyrings, home decor and gifts — designed and printed on demand. Browse the catalog and order in seconds over WhatsApp.',
  social_facebook: BUSINESS.social.facebook,
  social_instagram: BUSINESS.social.instagram,
  social_tiktok: BUSINESS.social.tiktok,
  social_youtube: BUSINESS.social.youtube,
  social_telegram: BUSINESS.social.telegram,
  review_url: REVIEW_URL,
}

function merge(row) {
  const out = { ...DEFAULT_SETTINGS }
  if (!row) return out
  for (const k of Object.keys(DEFAULT_SETTINGS)) {
    const v = row[k]
    if (v !== null && v !== undefined && String(v).trim() !== '') out[k] = v
  }
  return out
}

// Server-safe read used by pages and the root layout.
export async function getSettings() {
  if (!isSupabaseConfigured) return { ...DEFAULT_SETTINGS }
  try {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
    if (error) return { ...DEFAULT_SETTINGS }
    return merge(data)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

// Admin write.
export async function updateSettings(payload) {
  const row = { ...payload, id: 1, updated_at: new Date().toISOString() }
  const { error } = await supabase.from('site_settings').upsert(row, { onConflict: 'id' })
  if (error) throw error
}
