import { describe, it, expect, vi, beforeEach } from 'vitest'

// placeOrder talks to Supabase; replace the client with a stub that records the RPC.
const rpc = vi.fn()
vi.mock('@/lib/supabaseClient', () => ({
  isSupabaseConfigured: true,
  supabase: { rpc: (...a) => rpc(...a) },
}))

const { placeOrder } = await import('@/lib/orders')

const base = {
  customer_name: 'Rahim Uddin',
  customer_phone: '01712345678',
  customer_address: 'House 1, Road 2, Zindabazar, Sylhet',
  police_station: 'Sylhet Sadar, Sylhet',
  note: '',
  transaction_id: 'BKA1234567',
}

describe('placeOrder (checkout)', () => {
  beforeEach(() => { rpc.mockReset(); rpc.mockResolvedValue({ data: { order_number: '3D-1', cod: 1000, delivery: 70 }, error: null }) })

  it('accepts cart lines that use `quantity` and sends them to place_order', async () => {
    const r = await placeOrder({ ...base, items: [{ product_id: 'p1', quantity: 2 }] })
    expect(r.ok).toBe(true)
    expect(rpc).toHaveBeenCalledTimes(1)
    const [fn, args] = rpc.mock.calls[0]
    expect(fn).toBe('place_order')
    expect(args.p_items).toEqual([{ product_id: 'p1', quantity: 2 }])
    expect(args.p_transaction_id).toBe('BKA1234567')
  })

  it('still rejects an empty cart and bad details without calling the backend', async () => {
    expect((await placeOrder({ ...base, items: [] })).ok).toBe(false)
    expect((await placeOrder({ ...base, customer_phone: '123', items: [{ product_id: 'p1', quantity: 1 }] })).ok).toBe(false)
    expect(rpc).not.toHaveBeenCalled()
  })
})
