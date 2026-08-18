// SERVER ONLY. Transactional email via Resend's REST API (no SDK, works on the
// Vercel Node runtime). Provider is swappable — only this file talks to it.
// Credentials stay server-side (never NEXT_PUBLIC). Never log the API key.

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}

// Build a safe "From" header. MAIL_FROM may be a bare address or "Name <addr>".
function fromHeader() {
  const raw = process.env.MAIL_FROM || 'onboarding@resend.dev'
  if (raw.includes('<')) return raw
  const name = (process.env.MAIL_FROM_NAME || '3D Verse').replace(/[\r\n"<>]/g, '')
  return `${name} <${raw}>`
}

// to/subject are structured fields (no raw header concatenation → no header
// injection). Returns { ok, id, error }.
export async function sendEmail({ to, subject, html }) {
  if (!emailConfigured()) return { ok: false, error: 'Email is not configured on the server.' }
  const recipient = String(to || '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) || /[\r\n]/.test(recipient)) {
    return { ok: false, error: 'Invalid recipient email address.' }
  }
  const cleanSubject = String(subject || '').replace(/[\r\n]/g, ' ').slice(0, 200)
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromHeader(), to: [recipient], subject: cleanSubject, html }),
      cache: 'no-store',
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return { ok: false, error: (data && (data.message || data.name)) || `Email provider error (HTTP ${res.status}).` }
    }
    return { ok: true, id: data?.id || null }
  } catch {
    return { ok: false, error: 'Could not reach the email provider.' }
  }
}
