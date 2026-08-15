import { supabase, isSupabaseConfigured } from './supabaseClient'

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim())
}

// Adds an email to the mailing list. Duplicate emails are silently ignored.
export async function subscribe(email, { name = '', source = '' } = {}) {
  if (!isSupabaseConfigured) return { ok: false, error: 'Not configured' }
  const clean = (email || '').trim().toLowerCase()
  if (!isValidEmail(clean)) return { ok: false, error: 'Please enter a valid email address.' }
  const { error } = await supabase
    .from('subscribers')
    .upsert({ email: clean, name: name.trim(), source }, { onConflict: 'email', ignoreDuplicates: true })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function getSubscribers(limit = 5000) {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function deleteSubscriber(id) {
  const { error } = await supabase.from('subscribers').delete().eq('id', id)
  if (error) throw error
}
