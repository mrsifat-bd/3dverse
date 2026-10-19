import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Receives Content-Security-Policy violation reports (report-only mode) and
// writes a short, privacy-safe line to the server log: directive + blocked
// host only. No full URLs (they can contain query strings), no IP addresses.
// Bodies are capped so the endpoint cannot be used to flood the logs.
export async function POST(req) {
  try {
    const text = (await req.text()).slice(0, 8000)
    const body = JSON.parse(text || '{}')
    const reports = Array.isArray(body) ? body.map((r) => r.body || r) : [body['csp-report'] || body]
    for (const r of reports.slice(0, 5)) {
      const directive = String(r.effectiveDirective || r['effective-directive'] || r['violated-directive'] || '').slice(0, 40)
      let blocked = String(r.blockedURL || r['blocked-uri'] || '')
      try { blocked = new URL(blocked).host || blocked } catch {}
      let page = String(r.documentURL || r['document-uri'] || '')
      try { page = new URL(page).pathname } catch {}
      console.warn(`csp-violation directive=${directive} blocked=${blocked.slice(0, 80)} page=${page.slice(0, 80)}`)
    }
  } catch {}
  return new NextResponse(null, { status: 204 })
}
