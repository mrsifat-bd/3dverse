import { bdDay, lastDays, trafficSeries, ordersSeries, funnel, topViewed, deviceSplit, ordersByStatus, inPeriod } from '@/lib/dashboardStats'

const NOW = Date.parse('2026-11-02T10:00:00Z') // 16:00 in Dhaka
const at = (iso) => new Date(iso).toISOString()

describe('dashboard stats', () => {
  it('uses Bangladesh days (19:00 UTC on 1 Nov is 2 Nov in Dhaka)', () => {
    expect(bdDay('2026-11-01T19:00:00Z')).toBe('2026-11-02')
    expect(lastDays(3, NOW)).toEqual(['2026-10-31', '2026-11-01', '2026-11-02'])
  })
  it('traffic: daily views and unique visitors', () => {
    const pv = [
      { created_at: at('2026-11-02T05:00:00Z'), visitor_id: 'a' }, { created_at: at('2026-11-02T06:00:00Z'), visitor_id: 'a' },
      { created_at: at('2026-11-02T07:00:00Z'), visitor_id: 'b' }, { created_at: at('2026-11-01T05:00:00Z'), visitor_id: 'a' },
      { created_at: at('2026-10-01T05:00:00Z'), visitor_id: 'z' }, // outside 7 days
    ]
    const t = trafficSeries(pv, 7, NOW)
    expect(t.views.slice(-2)).toEqual([1, 3])
    expect(t.visitors.slice(-2)).toEqual([1, 2])
    expect(t.views.reduce((a, b) => a + b)).toBe(4)
  })
  it('orders: count all, sales exclude cancelled and delivery charge', () => {
    const o = [
      { created_at: at('2026-11-02T05:00:00Z'), status: 'confirmed', subtotal: 3300, discount: 0, delivery_charge: 120 },
      { created_at: at('2026-11-02T06:00:00Z'), status: 'cancelled', subtotal: 1000, discount: 0 },
      { created_at: at('2026-11-02T07:00:00Z'), status: 'delivered', subtotal: 2000, discount: 300 },
    ]
    const s = ordersSeries(o, 7, NOW)
    expect(s.count.at(-1)).toBe(3)
    expect(s.sales.at(-1)).toBe(5000)
  })
  it('funnel with conversion rates', () => {
    const leads = [...Array(10)].map(() => ({ action: 'view', created_at: at('2026-11-02T05:00:00Z') }))
      .concat([...Array(4)].map(() => ({ action: 'add_to_cart', created_at: at('2026-11-02T05:00:00Z') })))
    const orders = [{ created_at: at('2026-11-02T05:00:00Z'), status: 'delivered' }, { created_at: at('2026-11-02T05:00:00Z'), status: 'new' }]
    const f = funnel({ leads, orders }, 30, NOW)
    expect(f.map((s) => s.value)).toEqual([10, 4, 2, 1])
    expect(f.map((s) => s.rate)).toEqual([null, 40, 50, 50])
  })
  it('top viewed products, devices, orders by status', () => {
    const leads = [
      { action: 'view', product_id: 'p1', created_at: at('2026-11-02T05:00:00Z') }, { action: 'view', product_id: 'p1', created_at: at('2026-11-02T05:00:00Z') },
      { action: 'view', product_id: 'p2', created_at: at('2026-11-02T05:00:00Z') }, { action: 'add_to_cart', product_id: 'p2', created_at: at('2026-11-02T05:00:00Z') },
    ]
    expect(topViewed({ leads, products: [{ id: 'p1', name: 'Skull' }, { id: 'p2', name: 'Heart' }] }, 7, 10, NOW))
      .toEqual([{ id: 'p1', name: 'Skull', views: 2, carts: 0 }, { id: 'p2', name: 'Heart', views: 1, carts: 1 }])
    const pv = [{ device: 'Mobile', created_at: at('2026-11-02T05:00:00Z') }, { device: 'Mobile', created_at: at('2026-11-02T05:00:00Z') }, { device: 'Desktop', created_at: at('2026-11-02T05:00:00Z') }, { device: 'Mobile', created_at: at('2026-11-02T05:00:00Z') }]
    expect(deviceSplit(pv, 7, NOW)).toEqual([{ label: 'Mobile', value: 3, pct: 75 }, { label: 'Desktop', value: 1, pct: 25 }])
    const st = [{ value: 'new', label: 'New' }, { value: 'delivered', label: 'Delivered' }, { value: 'cancelled', label: 'Cancelled' }]
    expect(ordersByStatus([{ status: 'new', created_at: at('2026-11-02T05:00:00Z') }, { status: 'delivered', created_at: at('2026-11-02T05:00:00Z') }, { status: 'new', created_at: at('2026-11-02T05:00:00Z') }], st, 7, NOW))
      .toEqual([{ value: 'new', label: 'New', count: 2 }, { value: 'delivered', label: 'Delivered', count: 1 }])
    expect(inPeriod([{ created_at: at('2026-01-01T00:00:00Z') }], 90, NOW)).toEqual([])
  })
})
