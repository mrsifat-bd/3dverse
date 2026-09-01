import { createClient } from '@supabase/supabase-js'
import { emailConfigured, sendEmail } from '@/lib/email/service'
import { newOrderAdminEmail } from '@/lib/email/templates'
import { SITE_URL, BUSINESS } from '@/lib/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Called by a Supabase Database Webhook on INSERT into public.orders.
// Server-authoritative admin alert email. Security:
//  - Requires the shared secret header (x-webhook-secret === ORDER_WEBHOOK_SECRET).
//  - Dedup is atomic in the DB (claim_new_order_email sets a flag exactly once),
//    so retries / double-fires can NEVER send a duplicate admin email.
//  - Admin-created manual orders have no notification row -> claim returns false.
export async function POST(req) {
  const secret = process.env.ORDER_WEBHOOK_SECRET
  // Feature dormant until configured — 200 no-op so the webhook doesn't retry-spam.
  if (!secret) return json({ ok: true, skipped: 'not-configured' })
  if (req.headers.get('x-webhook-secret') !== secret) return json({ error: 'Unauthorized' }, 401)

  let body
  try { body = await req.json() } catch { return json({ error: 'Bad request' }, 400) }
  if (body?.type !== 'INSERT' || body?.table !== 'orders') return json({ ok: true, skipped: 'ignored-event' })
  const order = body?.record
  if (!order?.id) return json({ error: 'Missing order' }, 400)

  // Nothing to send if email isn't set up — do NOT claim (so it can send later
  // once configured, if you re-run the webhook).
  if (!emailConfigured()) return json({ ok: true, skipped: 'email-not-configured' })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return json({ ok: true, skipped: 'db-not-configured' })
  const supabase = createClient(url, anon, { auth: { persistSession: false } })

  // Atomic dedup: true only on the first claim for a customer order.
  const { data: claimed, error: claimErr } = await supabase.rpc('claim_new_order_email', { p_order_id: order.id })
  if (claimErr) return json({ error: 'Claim failed' }, 500)
  if (!claimed) return json({ ok: true, skipped: 'duplicate-or-admin-order' })

  const adminOrderUrl = `${(SITE_URL || '').replace(/\/$/, '')}/admin/orders?order=${order.id}`
  const to = (process.env.ADMIN_EMAILS || '').split(',')[0].trim() || BUSINESS.email
  const { subject, html } = newOrderAdminEmail(order, { adminOrderUrl })
  const result = await sendEmail({ to, subject, html })

  // Dedup already recorded; report the send outcome but keep the webhook happy
  // (a non-2xx would trigger retries that can't resend anyway).
  return json({ ok: true, sent: result.ok })
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } })
}
