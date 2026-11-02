// @vitest-environment node
// /api/orders/[orderId]/email with the real route code. Supabase and the email
// provider (Resend) are in-memory fakes, so we can inspect the exact email:
// latest amounts in the body and the latest invoice attached as a PDF.
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'

const SB = 'https://sb.test'
let calls, order, invoice, events

function fakeFetch(url, init = {}) {
  const u = new URL(String(url))
  const method = (init.method || 'GET').toUpperCase()
  const body = init.body ? JSON.parse(init.body) : null
  calls.push({ url: u.href, method, body })
  const json = (data, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }))
  const eq = (k) => (u.searchParams.get(k) || '').replace(/^eq\./, '')
  if (u.origin === SB && u.pathname === '/auth/v1/user') return json({ id: 'admin-1', email: '3dverse.bd@gmail.com' })
  if (u.origin === SB && u.pathname === '/rest/v1/orders') return json(order)
  if (u.origin === SB && u.pathname === '/rest/v1/invoices') return json(invoice)
  if (u.origin === SB && u.pathname === '/rest/v1/settings') return json([])
  if (u.origin === SB && u.pathname === '/rest/v1/order_email_events' && method === 'GET') {
    return json(events.filter((e) => e.order_id === eq('order_id') && e.email_type === eq('email_type') && e.status === eq('status')))
  }
  if (u.origin === SB && u.pathname === '/rest/v1/order_email_events' && method === 'POST') { events.push(body); return json({ id: 'ev', ...body }, 201) }
  if (u.href === 'https://api.resend.com/emails') return json({ id: 'msg-1' })
  return json({ message: 'not found' }, 404)
}

async function send(emailType, extra = {}) {
  const { POST } = await import('@/app/api/orders/[orderId]/email/route.js')
  const req = new Request('https://3dversebd.com/api/orders/o-1/email', {
    method: 'POST',
    headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailType, ...extra }),
  })
  const res = await POST(req, { params: Promise.resolve({ orderId: 'o-1' }) })
  return { status: res.status, body: await res.json() }
}
const resendCall = () => calls.find((c) => c.url === 'https://api.resend.com/emails')

beforeEach(() => {
  vi.resetModules()
  calls = []; events = []
  process.env.NEXT_PUBLIC_SUPABASE_URL = SB
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
  process.env.RESEND_API_KEY = 'test-resend'
  order = {
    id: 'o-1', order_number: '3D-20261031-001', user_id: 'cust-1', payment_status: 'verified', status: 'confirmed',
    customer_name: 'Rony', customer_email: 'rony@example.com', customer_phone: '01754797399',
    items: [{ name: 'Mandible', qty: 1, unit_price: 1200 }, { name: 'Base of the Skull', qty: 1, unit_price: 2100 }],
    delivery_charge: 120, discount: 0, subtotal: 3300, total: 3420, cod_amount: 3300, created_at: '2026-10-31T10:00:00Z',
  }
  invoice = {
    id: 'inv-1', order_id: 'o-1', invoice_number: '3D-INV-20261031-001', invoice_date: '2026-10-31T10:00:00Z',
    customer_name: 'Rony', items: order.items, subtotal: 3300, delivery_charge: 120, discount: 0, total: 3420,
    payment_status: 'partial', payment_method: 'cod', paid_amount: 120,
  }
  vi.stubGlobal('fetch', vi.fn(fakeFetch))
})
afterEach(() => vi.unstubAllGlobals())

describe('customer emails carry the latest invoice', () => {
  it('Order Confirmed: latest invoice PDF attached, amounts in the body', async () => {
    const r = await send('ORDER_CONFIRMED')
    expect(r.status).toBe(200)
    expect(r.body.attached).toBe('3D-INV-20261031-001.pdf')
    const mail = resendCall().body
    expect(mail.to).toEqual(['rony@example.com'])
    expect(mail.attachments).toHaveLength(1)
    expect(mail.attachments[0].filename).toBe('3D-INV-20261031-001.pdf')
    expect(Buffer.from(mail.attachments[0].content, 'base64').subarray(0, 5).toString('latin1')).toBe('%PDF-')
    expect(mail.html).toContain('3D-INV-20261031-001')
    expect(mail.html).toContain('Delivery charge paid (bKash)')
    expect(mail.html).toMatch(/Pay on delivery \(cash\)[\s\S]*৳3,300/)
    expect(events.at(-1)).toMatchObject({ email_type: 'ORDER_CONFIRMED', status: 'sent' })
  })

  it('uses the invoice as it is at send time (after a charges update)', async () => {
    invoice.discount = 300; invoice.total = 3120; order.discount = 300
    await send('ORDER_CONFIRMED')
    const pdf = Buffer.from(resendCall().body.attachments[0].content, 'base64').toString('latin1')
    expect(pdf.startsWith('%PDF-')).toBe(true)
    expect(resendCall().body.html).toMatch(/Pay on delivery \(cash\)[\s\S]*৳3,000/)
  })

  it('Sent for Delivery: also attaches the invoice', async () => {
    await send('SENT_FOR_DELIVERY')
    expect(resendCall().body.attachments[0].filename).toBe('3D-INV-20261031-001.pdf')
  })

  it('Request for Review: no attachment', async () => {
    await send('REVIEW_REQUEST')
    expect(resendCall().body.attachments).toBeUndefined()
  })

  it('no invoice yet: sends without an attachment', async () => {
    invoice = null
    const r = await send('ORDER_CONFIRMED')
    expect(r.status).toBe(200)
    expect(resendCall().body.attachments).toBeUndefined()
    expect(resendCall().body.html).not.toContain('is attached as a PDF')
  })

  it('a manual tick does not block sending the real email', async () => {
    events.push({ order_id: 'o-1', email_type: 'ORDER_CONFIRMED', status: 'manual' })
    expect((await send('ORDER_CONFIRMED')).status).toBe(200)
  })

  it('email key missing: clear error, nothing sent', async () => {
    delete process.env.RESEND_API_KEY
    const r = await send('ORDER_CONFIRMED')
    expect(r.status).toBe(503)
    expect(resendCall()).toBeUndefined()
  })
})
