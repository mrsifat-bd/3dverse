import { supabase, isSupabaseConfigured } from './supabaseClient'

function parseUA(ua) {
  const device = /Mobile|Android|iPhone/i.test(ua)
    ? /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Mobile'
    : /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Desktop'
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

// A stable anonymous visitor id kept in localStorage (no personal data).
export function visitorId() {
  if (typeof window === 'undefined') return ''
  try {
    let v = localStorage.getItem('3dv_vid')
    if (!v) {
      v = (window.crypto?.randomUUID?.() || Date.now() + Math.random().toString(36).slice(2))
      localStorage.setItem('3dv_vid', v)
    }
    return v
  } catch {
    return ''
  }
}

export async function recordPageView(path) {
  if (!isSupabaseConfigured || typeof window === 'undefined') return
  try {
    const ua = navigator.userAgent || ''
    const { device, browser, os } = parseUA(ua)
    await supabase.from('page_views').insert({
      path: path || window.location.pathname,
      visitor_id: visitorId(),
      referrer: document.referrer || '',
      device,
      browser,
      os,
      user_agent: ua,
    })
  } catch {}
}

export async function recordSearch(query) {
  if (!isSupabaseConfigured || typeof window === 'undefined') return
  const q = (query || '').trim()
  if (!q) return
  try {
    await supabase.from('search_queries').insert({ query: q.slice(0, 120), visitor_id: visitorId() })
  } catch {}
}

// Admin reads.
export async function getPageViews(limit = 5000) {
  const { data, error } = await supabase
    .from('page_views')
    .select('created_at,visitor_id,path,device')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function getSearches(limit = 2000) {
  const { data, error } = await supabase
    .from('search_queries')
    .select('created_at,query,visitor_id')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}
