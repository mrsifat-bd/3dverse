import { requireAdmin } from '@/lib/serverSupabase'
import { emailConfigured, sendEmail } from '@/lib/email/service'
import { EMAIL_TYPES, EMAILS_WITH_INVOICE, renderOrderEmail } from '@/lib/email/templates'
import { buildInvoicePdf } from '@/lib/invoicePdfBuild'
import { getSettings } from '@/lib/settings'
import { trackingUrl } from '@/lib/steadfast'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req, props) {
  const params = await props.params;
  // AuthN + AuthZ: only allowlisted admins, verified server-side.
  const auth = await requireAdmin(req)
  if (auth.error) return json({ error: auth.error }, auth.status)
  const { supabase, user } = auth

  const orderId = params?.orderId
  if (!orderId) return json({ error: 'Missing order id.' }, 400)

  let body
  try { body = await req.json() } catch { return json({ error: 'Bad request.' }, 400) }
  const emailType = String(body?.emailType || '')
  if (!EMAIL_TYPES.includes(emailType)) return json({ error: 'Unknown email type.' }, 422)
  const resend = body?.resend === true

  // Load the order (RLS restricts to admins here).
  const { data: order, error: oErr } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (oErr) return json({ error: 'Could not load the order.' }, 500)
  if (!order) return json({ error: 'Order not found.' }, 404)

  const recipient = String(order.customer_email || '').trim()
  if (!EMAIL_RE.test(recipient)) return json({ error: 'No valid email address for this customer.' }, 422)

  // Duplicate protection: a first send is blocked if this type was already sent —
  // the admin must explicitly resend. Guards against accidental / concurrent double sends.
  if (!resend) {
    const { data: prior } = await supabase
      .from('order_email_events')
      .select('id').eq('order_id', orderId).eq('email_type', emailType).eq('status', 'sent').limit(1)
    if (prior && prior.length) return json({ error: 'This email has already been sent.', alreadySent: true }, 409)
  }

  if (!emailConfigured()) return json({ error: 'Email is not set up yet. Add the email provider key on the server.' }, 503)

  // Build template inputs from real order data (no hardcoding, no invented URLs).
  let reviewUrl = ''
  try { reviewUrl = (await getSettings())?.review_url || '' } catch {}
  // Attach the invoice PDF built NOW from the current invoice row, so any
  // charge/payment changes made before sending are included.
  const attachments = []
  let invoiceNumber = ''
  if (EMAILS_WITH_INVOICE.includes(emailType)) {
    const pdf = await buildInvoicePdf({ supabase, orderId, origin: new URL(req.url).origin })
    if (pdf.buffer) {
      attachments.push({ filename: pdf.filename, content: pdf.buffer })
      invoiceNumber = pdf.invoice.invoice_number
    } else if (pdf.status !== 404) {
      // An invoice exists but its PDF failed: don't send an email that is missing it.
      return json({ error: 'Could not attach the invoice PDF, so the email was not sent. Please try again.' }, 500)
    }
  }

  const trackingCode = order.steadfast_tracking_code || ''
  const rendered = renderOrderEmail(emailType, order, {
    trackingCode,
    trackingUrl: trackingCode ? trackingUrl(trackingCode) : '',
    reviewUrl,
    invoiceNumber,
  })
  if (!rendered) return json({ error: 'Unknown email type.' }, 422)

  const result = await sendEmail({ to: recipient, subject: rendered.subject, html: rendered.html, attachments })

  // Record the attempt — only 'sent' on a real provider success.
  const nowIso = new Date().toISOString()
  const { data: event } = await supabase.from('order_email_events').insert({
    order_id: orderId,
    email_type: emailType,
    recipient_email: recipient,
    status: result.ok ? 'sent' : 'failed',
    sent_at: result.ok ? nowIso : null,
    sent_by: user.email || '',
    provider_message_id: result.ok ? result.id : null,
    error_message: result.ok ? null : String(result.error || '').slice(0, 500),
  }).select('id, email_type, status, sent_at, sent_by, recipient_email').single()

  if (!result.ok) return json({ error: 'Failed to send email. Please try again.' }, 502)
  return json({ ok: true, event, attached: invoiceNumber ? `${invoiceNumber}.pdf` : null })
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } })
}
