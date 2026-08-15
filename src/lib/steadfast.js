// SERVER ONLY. Never import this from a client component.
// Reads Steadfast credentials from server-side env vars (no NEXT_PUBLIC_ prefix),
// so the API key/secret never reach the browser.

const BASE_URL = (process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1').replace(/\/$/, '')

export function steadfastConfigured() {
  return Boolean(process.env.STEADFAST_API_KEY && process.env.STEADFAST_SECRET_KEY)
}

// Public customer tracking URL base (configurable; Steadfast's tracking page).
export function trackingUrl(trackingCode) {
  if (!trackingCode) return ''
  const base = (process.env.STEADFAST_TRACKING_URL_BASE || 'https://steadfast.com.bd/t/').replace(/\/$/, '')
  return `${base}/${trackingCode}`
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Api-Key': process.env.STEADFAST_API_KEY,
    'Secret-Key': process.env.STEADFAST_SECRET_KEY,
  }
}

async function request(path, { method = 'GET', body, timeoutMs = 15000 } = {}) {
  if (!steadfastConfigured()) {
    return { ok: false, httpStatus: 0, error: 'Steadfast credentials are not configured on the server.' }
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: authHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: 'no-store',
    })
    let data = null
    try {
      data = await res.json()
    } catch {
      data = null
    }
    if (!res.ok) {
      const msg =
        (data && (data.message || data.error)) ||
        (res.status === 401 ? 'Invalid Steadfast credentials.' : `Steadfast API error (HTTP ${res.status}).`)
      return { ok: false, httpStatus: res.status, error: msg, fieldErrors: data?.errors || null }
    }
    return { ok: true, httpStatus: res.status, data }
  } catch (e) {
    const aborted = e?.name === 'AbortError'
    return { ok: false, httpStatus: 0, error: aborted ? 'Steadfast request timed out.' : 'Could not reach Steadfast.' }
  } finally {
    clearTimeout(timer)
  }
}

// POST /create_order — documented fields only.
export async function createConsignment({ invoice, recipient_name, recipient_phone, recipient_address, cod_amount, note, item_description }) {
  const body = {
    invoice,
    recipient_name: String(recipient_name || '').slice(0, 100),
    recipient_phone: String(recipient_phone || '').replace(/[\s-]/g, ''),
    recipient_address: String(recipient_address || '').slice(0, 250),
    cod_amount: Number(cod_amount) || 0,
  }
  if (note) body.note = String(note).slice(0, 250)
  if (item_description) body.item_description = String(item_description).slice(0, 250)
  return request('/create_order', { method: 'POST', body })
}

// GET /status_by_cid/{id}
export async function statusByConsignmentId(cid) {
  return request(`/status_by_cid/${encodeURIComponent(cid)}`)
}
