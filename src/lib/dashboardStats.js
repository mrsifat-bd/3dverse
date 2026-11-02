// Pure helpers that turn raw rows (page views, product interactions, orders)
// into dashboard chart data. No I/O, so they are unit tested directly.
// All day boundaries use Bangladesh time (Asia/Dhaka, UTC+6, no DST).

const DAY = 86400000
const BD_OFFSET = 6 * 3600000

// 'YYYY-MM-DD' of a timestamp in Bangladesh time.
export function bdDay(t) {
  const d = new Date(new Date(t).getTime() + BD_OFFSET)
  return d.toISOString().slice(0, 10)
}

// The last `days` Bangladesh dates, oldest first, ending today.
export function lastDays(days, now = Date.now()) {
  return Array.from({ length: days }, (_, i) => bdDay(now - (days - 1 - i) * DAY))
}

export function dayLabel(iso, days) {
  const d = new Date(iso + 'T00:00:00Z')
  return days <= 7
    ? d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

export function inPeriod(rows, days, now = Date.now(), field = 'created_at') {
  const from = lastDays(days, now)[0]
  return (rows || []).filter((r) => r?.[field] && bdDay(r[field]) >= from)
}

// Daily page views and unique visitors.
export function trafficSeries(pageViews, days, now = Date.now()) {
  const keys = lastDays(days, now)
  const idx = Object.fromEntries(keys.map((k, i) => [k, i]))
  const views = keys.map(() => 0)
  const visitorSets = keys.map(() => new Set())
  for (const v of pageViews || []) {
    const i = idx[bdDay(v.created_at)]
    if (i === undefined) continue
    views[i]++
    if (v.visitor_id) visitorSets[i].add(v.visitor_id)
  }
  return { days: keys, views, visitors: visitorSets.map((s) => s.size) }
}

const NOT_SOLD = new Set(['cancelled', 'returned', 'failed'])

// Daily orders (all) and sales (product value of orders that were not
// cancelled/returned/failed).
export function ordersSeries(orders, days, now = Date.now()) {
  const keys = lastDays(days, now)
  const idx = Object.fromEntries(keys.map((k, i) => [k, i]))
  const count = keys.map(() => 0)
  const sales = keys.map(() => 0)
  for (const o of orders || []) {
    const i = idx[bdDay(o.created_at)]
    if (i === undefined) continue
    count[i]++
    if (!NOT_SOLD.has(o.status)) sales[i] += Math.max(0, (Number(o.subtotal) || 0) - (Number(o.discount) || 0))
  }
  return { days: keys, count, sales }
}

// Product views -> added to cart -> orders -> delivered, in the period.
export function funnel({ leads, orders }, days, now = Date.now()) {
  const L = inPeriod(leads, days, now)
  const O = inPeriod(orders, days, now)
  const views = L.filter((l) => l.action === 'view').length
  const carts = L.filter((l) => l.action === 'add_to_cart').length
  const placed = O.length
  const delivered = O.filter((o) => o.status === 'delivered').length
  const steps = [
    { key: 'views', label: 'Product views', value: views },
    { key: 'carts', label: 'Added to cart', value: carts },
    { key: 'orders', label: 'Orders placed', value: placed },
    { key: 'delivered', label: 'Delivered', value: delivered },
  ]
  return steps.map((s, i) => ({ ...s, rate: i === 0 || !steps[i - 1].value ? null : Math.round((s.value / steps[i - 1].value) * 100) }))
}

// Most viewed products in the period (by product id), with cart adds.
export function topViewed({ leads, products }, days, limit = 10, now = Date.now()) {
  const map = new Map()
  for (const l of inPeriod(leads, days, now)) {
    const id = String(l.product_id || '')
    if (!id) continue
    const e = map.get(id) || { views: 0, carts: 0, name: l.product_name || '' }
    if (l.action === 'view') e.views++
    else if (l.action === 'add_to_cart') e.carts++
    map.set(id, e)
  }
  const byId = Object.fromEntries((products || []).map((p) => [String(p.id), p]))
  return [...map.entries()]
    .map(([id, e]) => ({ id, name: byId[id]?.name || e.name || 'Product', views: e.views, carts: e.carts }))
    .filter((r) => r.views > 0 || r.carts > 0)
    .sort((a, b) => b.views - a.views || b.carts - a.carts)
    .slice(0, limit)
}

export function deviceSplit(pageViews, days, now = Date.now()) {
  const counts = {}
  for (const v of inPeriod(pageViews, days, now)) {
    const d = v.device || 'Unknown'
    counts[d] = (counts[d] || 0) + 1
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, pct: total ? Math.round((value / total) * 100) : 0 }))
}

export function ordersByStatus(orders, statuses, days, now = Date.now()) {
  const O = inPeriod(orders, days, now)
  return statuses
    .map((s) => ({ value: s.value, label: s.label, count: O.filter((o) => (o.status || 'new') === s.value).length }))
    .filter((s) => s.count > 0)
}

// Most visited pages (path without language prefix duplicates merged).
export function topPages(pageViews, days, limit = 8, now = Date.now()) {
  const counts = {}
  for (const v of inPeriod(pageViews, days, now)) {
    const p = String(v.path || '/').split('?')[0] || '/'
    counts[p] = (counts[p] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([label, value]) => ({ label, value }))
}
