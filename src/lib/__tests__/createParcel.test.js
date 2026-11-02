// @vitest-environment node
// End-to-end check of /api/steadfast/create-parcel with the real route code:
// Supabase and the Steadfast API are replaced by an in-memory fake, so we can
// see exactly what is sent to the courier and what is written to the order.
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'

const SB = 'https://sb.test'
const SF = 'https://sf.test/api/v1'
let calls, order, sfResponse

function fakeFetch(url, init = {}) {
  const u = new URL(String(url))
  const method = (init.method || 'GET').toUpperCase()
  const body = init.body ? JSON.parse(init.body) : null
  calls.push({ url: u.href, method, body, headers: init.headers })
  const json = (data, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }))
  if (u.origin === SB && u.pathname === '/auth/v1/user') return json({ id: 'admin-1', email: '3dverse.bd@gmail.com' })
  if (u.origin === SB && u.pathname === '/rest/v1/orders' && method === 'GET') return json(order)
  if (u.origin === SB && u.pathname === '/rest/v1/orders' && method === 'PATCH') { Object.assign(order, body); return json([]) }
  if (u.origin === SB && u.pathname === '/rest/v1/order_events') return json([], 201)
  if (u.href === SF + '/create_order') return json(sfResponse.body, sfResponse.status)
  if (u.href === SF + '/get_balance') return json(sfResponse.balance || { status: 200, current_balance: 5000 }, sfResponse.balanceStatus || 200)
  return json({ message: 'unexpected ' + u.href }, 500)
}

async function post(payload = { orderId: 'o-1' }) {
  const { POST } = await import('@/app/api/steadfast/create-parcel/route.js')
  const req = new Request('https://3dversebd.com/api/steadfast/create-parcel', {
    method: 'POST',
    headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const res = await POST(req)
  return { status: res.status, body: await res.json() }
}

beforeEach(() => {
  vi.resetModules()
  calls = []
  process.env.NEXT_PUBLIC_SUPABASE_URL = SB
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
  process.env.STEADFAST_BASE_URL = SF
  process.env.STEADFAST_API_KEY = 'test-api-key'
  process.env.STEADFAST_SECRET_KEY = 'test-secret'
  order = {
    id: 'o-1', order_number: '3D-20261031-001', user_id: 'cust-1', payment_status: 'verified', status: 'confirmed',
    customer_name: 'Rony', customer_phone: '01754797399', customer_address: '52, lake drive road, Nikunja 1, Khilkhet',
    police_station: 'Savar, Dhaka', note: '', weight_kg: 0.5,
    items: [{ name: 'Mandible', qty: 1, unit_price: 1200 }, { name: 'Base of the Skull (without vault)', qty: 1, unit_price: 2100 }],
    delivery_charge: 120, discount: 0, subtotal: 3300, total: 3420,
    cod_amount: 3420, // inflated by the old "Save charges" bug
    steadfast_consignment_id: null,
  }
  sfResponse = { status: 200, body: { status: 200, consignment: { consignment_id: 1424107, tracking_code: '15BAEB8A', status: 'in_review' } } }
  vi.stubGlobal('fetch', vi.fn(fakeFetch))
})
afterEach(() => vi.unstubAllGlobals())

describe('create Steadfast parcel', () => {
  it('sends the right parcel to Steadfast and records it on the order', async () => {
    const r = await post()
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ ok: true, consignment_id: '1424107', tracking_code: '15BAEB8A' })
    const sf = calls.find((c) => c.url === SF + '/create_order')
    expect(sf.headers['Api-Key']).toBe('test-api-key')
    expect(sf.headers['Secret-Key']).toBe('test-secret')
    expect(sf.body).toMatchObject({
      invoice: '3D-20261031-001',
      recipient_name: 'Rony',
      recipient_phone: '01754797399',
      recipient_address: '52, lake drive road, Nikunja 1, Khilkhet, Savar, Dhaka',
      cod_amount: 3300, // product price only: delivery was paid by bKash
    })
    expect(order).toMatchObject({ status: 'sent_to_steadfast', steadfast_consignment_id: '1424107', steadfast_tracking_code: '15BAEB8A', cod_amount: 3300 })
  })

  it('manual admin order: courier collects delivery too', async () => {
    order.user_id = null; order.payment_status = 'pending'
    await post()
    expect(calls.find((c) => c.url === SF + '/create_order').body.cod_amount).toBe(3420)
  })

  it('explains clearly when the Steadfast keys are missing', async () => {
    delete process.env.STEADFAST_API_KEY
    const r = await post()
    expect(r.status).toBe(503)
    expect(r.body.error).toMatch(/STEADFAST_API_KEY and STEADFAST_SECRET_KEY/)
    expect(calls.some((c) => c.url.startsWith(SF))).toBe(false)
  })

  it('shows Steadfast\'s own error and leaves the order unchanged', async () => {
    sfResponse = { status: 401, body: { message: 'Unauthorized' } }
    const r = await post()
    expect(r.status).toBe(502)
    expect(r.body.error).toBe('Unauthorized')
    expect(order.status).toBe('confirmed')
    expect(order.steadfast_consignment_id).toBe(null)
  })

  it('never creates a second parcel for the same order', async () => {
    order.steadfast_consignment_id = '999'
    const r = await post()
    expect(r.status).toBe(409)
    expect(calls.some((c) => c.url.startsWith(SF))).toBe(false)
  })
})

describe('Steadfast connection check (read-only)', () => {
  async function check() {
    const { GET } = await import('@/app/api/steadfast/check/route.js')
    const res = await GET(new Request('https://3dversebd.com/api/steadfast/check', { headers: { Authorization: 'Bearer test-token' } }))
    return { status: res.status, body: await res.json() }
  }
  it('reports connected with the balance and never creates anything', async () => {
    const r = await check()
    expect(r.body).toEqual({ ok: true, balance: 5000 })
    expect(calls.some((c) => c.url === SF + '/create_order')).toBe(false)
    expect(calls.find((c) => c.url === SF + '/get_balance').method).toBe('GET')
  })
  it('reports wrong keys', async () => {
    sfResponse.balanceStatus = 401; sfResponse.balance = { message: 'Unauthorized' }
    expect((await check()).body).toEqual({ ok: false, error: 'Unauthorized' })
  })
  it('reports missing keys without calling Steadfast', async () => {
    delete process.env.STEADFAST_SECRET_KEY
    const r = await check()
    expect(r.body.ok).toBe(false)
    expect(calls.some((c) => c.url.startsWith(SF))).toBe(false)
  })
})
