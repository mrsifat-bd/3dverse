import { supabase, isSupabaseConfigured } from './supabaseClient'

function parseUA(ua) {
  const device = /Mobile|Android|iPhone/i.test(ua)
    ? /iPad|Tablet/i.test(ua)
      ? 'Tablet'
      : 'Mobile'
    : /iPad|Tablet/i.test(ua)
      ? 'Tablet'
      : 'Desktop'
  let browser = 'Unknown'
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera'
  else if (/Chrome\//i.test(ua)) browser = 'Chrome'
  else if (/Firefox\//i.test(ua)) browser = 'Firefox'
  else if (/Safari\//i.test(ua)) browser = 'Safari'
  let os = 'Unknown'
  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/iPhone|iPad|iOS/i.test(ua)) os = 'iOS'
  else if (/Mac OS X/i.test(ua)) os = 'macOS'
  else if (/Linux/i.test(ua)) os = 'Linux'
  return { device, browser, os }
}

async function getGeo() {
  // Free, keyless, CORS-enabled IP geolocation (approximate — city/country level).
  try {
    const r = await fetch('https://ipwho.is/', { cache: 'no-store' })
    const d = await r.json()
    if (d && d.success !== false) {
      return { ip: d.ip || '', country: d.country || '', city: d.city || '', region: d.region || '' }
    }
  } catch {}
  return { ip: '', country: '', city: '', region: '' }
}

// Fire-and-forget lead capture on a product interaction (client only).
export async function recordLead({ action = 'view', product }) {
  if (!isSupabaseConfigured || typeof window === 'undefined') return
  try {
    const ua = navigator.userAgent || ''
    const { device, browser, os } = parseUA(ua)
    const geo = await getGeo()
    await supabase.from('leads').insert({
      action,
      product_id: String(product?.id || ''),
      product_name: product?.name || '',
      product_slug: product?.slug || '',
      user_agent: ua,
      device,
      browser,
      os,
      ...geo,
      referrer: (typeof document !== 'undefined' && document.referrer) || '',
      page_url: window.location.href,
    })
  } catch {
    // never block the UI on tracking
  }
}

// Lead pipeline statuses (for WhatsApp order-intent leads).
export const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export async function updateLeadStatus(id, status) {
  const { error } = await supabase.from('leads').update({ status }).eq('id', id)
  if (error) throw error
}

export async function getLeads(limit = 1000) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function deleteLead(id) {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw error
}
