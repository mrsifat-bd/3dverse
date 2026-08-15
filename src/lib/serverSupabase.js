// SERVER ONLY. Helpers for API route handlers.
import { createClient } from '@supabase/supabase-js'

// Admin identity = email allowlist (server-side). Keep in sync with the
// public.admin_emails table used by the database's is_admin() RLS check.
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '3dverse.bd@gmail.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(String(email || '').toLowerCase())
}

function bearer(req) {
  const h = req.headers.get('authorization') || ''
  return h.startsWith('Bearer ') ? h.slice(7) : ''
}

// Returns a Supabase client scoped to the caller's JWT (so RLS applies), after
// verifying the session belongs to an allowlisted admin. No service-role key.
export async function requireAdmin(req) {
  const auth = await requireUser(req)
  if (auth.error) return auth
  if (!isAdminEmail(auth.user.email)) return { error: 'Forbidden.', status: 403 }
  return auth
}

// Verifies any valid logged-in user (customer or admin).
export async function requireUser(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return { error: 'Server is not configured.', status: 500 }

  const token = bearer(req)
  if (!token) return { error: 'Not authenticated.', status: 401 }

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return { error: 'Not authenticated.', status: 401 }
  return { supabase, user: data.user }
}
