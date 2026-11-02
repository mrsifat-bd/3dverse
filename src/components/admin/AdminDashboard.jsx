'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Package, CheckCircle, Clock, Mail, Plus, RefreshCw, Loader2, Users, AlertTriangle, Activity, ShoppingBag,
} from 'lucide-react'
import { listProducts } from '@/lib/adminProducts'
import { getLeads } from '@/lib/leads'
import { getOrders, ORDER_STATUSES, orderStatusLabel } from '@/lib/orders'
import { formatPrice } from '@/lib/format'
import { trafficSeries, ordersSeries, funnel, topViewed, deviceSplit, ordersByStatus, topPages, inPeriod, dayLabel } from '@/lib/dashboardStats'
import { TrendChart, ColumnChart, BarList, SplitBar } from './Charts'
import { getSubscribers } from '@/lib/subscribers'
import { getPageViews, getSearches } from '@/lib/analytics'
import { Button } from '@/components/ui/button'

const DAY = 86400000

// Order status colours for the status chart.
const ORDER_COLORS = {
  new: '#C99A4E', confirmed: '#4E86B0', ready: '#7C6FB0', sent_to_steadfast: '#C0603A', shipped: '#C0603A',
  delivered: '#2E8B54', cancelled: '#9A6A62', returned: '#9A6A62', failed: '#9A6A62',
}
// Orders still waiting for the shop to act on.
const TO_SHIP = ['new', 'confirmed', 'ready']
const taka = (n) => '৳' + (Number(n) || 0).toLocaleString('en-IN')

function fmtDate(d) {
  try {
    return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return d
  }
}
function fmtDay(d) {
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  } catch {
    return d
  }
}
function within(items, field, days) {
  const cut = Date.now() - days * DAY
  return items.filter((x) => new Date(x[field]).getTime() >= cut)
}

export default function AdminDashboard() {
  const [products, setProducts] = useState(null)
  const [leads, setLeads] = useState([])
  const [orders, setOrders] = useState([])
  const [subscribers, setSubscribers] = useState([])
  const [pageViews, setPageViews] = useState([])
  const [searches, setSearches] = useState([])
  const [error, setError] = useState('')
  const [analyticsWarning, setAnalyticsWarning] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState(30)

  const load = useCallback(async () => {
    setRefreshing(true)
    setError('')
    const [prod, lds, subs, pv, sr, ord] = await Promise.allSettled([
      listProducts(),
      getLeads(),
      getSubscribers(),
      getPageViews(20000),
      getSearches(),
      getOrders(2000),
    ])
    if (prod.status === 'fulfilled') setProducts(prod.value)
    else { setError(prod.reason?.message || 'Failed to load products'); setProducts([]) }
    setLeads(lds.status === 'fulfilled' ? lds.value : [])
    setSubscribers(subs.status === 'fulfilled' ? subs.value : [])
    setOrders(ord.status === 'fulfilled' ? ord.value : [])
    // page_views / search_queries may not exist until the migration is run.
    const pvOk = pv.status === 'fulfilled'
    const srOk = sr.status === 'fulfilled'
    setPageViews(pvOk ? pv.value : [])
    setSearches(srOk ? sr.value : [])
    setAnalyticsWarning(!pvOk || !srOk ? 'Visitor & search analytics are unavailable — run the dashboard migration to enable them.' : '')
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  const traffic = useMemo(() => trafficSeries(pageViews, period), [pageViews, period])
  const orderSeries = useMemo(() => ordersSeries(orders, period), [orders, period])
  const labels = useMemo(() => traffic.days.map((d) => dayLabel(d, period)), [traffic, period])
  const steps = useMemo(() => funnel({ leads, orders }, period), [leads, orders, period])
  const viewed = useMemo(() => topViewed({ leads, products }, period, 10), [leads, products, period])
  const devices = useMemo(() => deviceSplit(pageViews, period), [pageViews, period])
  const pages = useMemo(() => topPages(pageViews, period, 8), [pageViews, period])
  const statusRows = useMemo(() => ordersByStatus(orders, ORDER_STATUSES, period), [orders, period])

  const kpis = useMemo(() => {
    const p = products || []
    const periodOrders = inPeriod(orders, period)
    const visitors = new Set(inPeriod(pageViews, period).map((v) => v.visitor_id).filter(Boolean)).size
    return {
      total: p.length,
      outStock: p.filter((x) => !x.in_stock).length,
      visitors,
      orders: periodOrders.length,
      toShip: orders.filter((o) => TO_SHIP.includes(o.status || 'new')).length,
      sales: orderSeries.sales.reduce((a, b) => a + b, 0),
      subscribers: subscribers.length,
      newSubs: within(subscribers, 'created_at', 7).length,
    }
  }, [products, orders, pageViews, subscribers, period, orderSeries])

  const outOfStock = useMemo(() => (products || []).filter((p) => !p.in_stock), [products])

  const activity = useMemo(() => {
    const items = []
    for (const p of products || []) items.push({ key: 'p' + p.id, when: p.created_at, text: `Product added — ${p.name}`, Icon: Package })
    for (const o of orders) items.push({ key: 'o' + o.id, when: o.created_at, text: `Order ${o.order_number || ''} — ${o.customer_name || 'customer'}`, Icon: ShoppingBag })
    for (const s of subscribers) items.push({ key: 's' + s.id, when: s.created_at, text: `New subscriber — ${s.email}`, Icon: Mail })
    items.sort((a, b) => new Date(b.when) - new Date(a.when))
    return items.slice(0, 8)
  }, [products, orders, subscribers])

  const topSearches = useMemo(() => {
    const counts = {}
    for (const s of inPeriod(searches, period)) {
      const q = (s.query || '').trim().toLowerCase()
      if (q) counts[q] = (counts[q] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [searches, period])

  if (products === null) {
    return (
      <div className="flex items-center gap-2 py-24 text-stone">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading dashboard…
      </div>
    )
  }

  const periodText = `last ${period} days`
  const kpiCards = [
    { label: 'Visitors', value: kpis.visitors.toLocaleString('en-IN'), sub: periodText, Icon: Users, href: '#traffic' },
    { label: 'Orders', value: kpis.orders, sub: periodText, Icon: ShoppingBag, href: '/admin/orders' },
    { label: 'Sales', value: taka(kpis.sales), sub: `products, ${periodText}`, Icon: CheckCircle, href: '#sales' },
    { label: 'Orders to ship', value: kpis.toShip, sub: 'new, confirmed or ready', Icon: Clock, href: '/admin/orders' },
    { label: 'Products', value: kpis.total, sub: kpis.outStock ? `${kpis.outStock} out of stock` : 'all in stock', Icon: Package, href: '/admin/products' },
    { label: 'Subscribers', value: kpis.subscribers, sub: kpis.newSubs ? `+${kpis.newSubs} this week` : 'mailing list', Icon: Mail, href: '/admin/subscribers' },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-stone">Traffic, product interest and orders at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-full border border-line p-1" role="group" aria-label="Period">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={period === d}
                onClick={() => setPeriod(d)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/50 ${period === d ? 'bg-clay text-white' : 'text-stone hover:text-ink'}`}
              >
                {d} days
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={load} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild><Link href="/admin/products/new"><Plus className="h-4 w-4" /> New product</Link></Button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {analyticsWarning && <p className="mb-4 rounded-xl border border-clay/30 bg-clay/5 p-3 text-xs text-stone">{analyticsWarning}</p>}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map(({ label, value, sub, Icon, href }, i) => (
          <Link
            key={label}
            href={href}
            style={{ animationDelay: `${i * 50}ms` }}
            className="fade-up rounded-2xl border border-line bg-paper p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-md hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/50"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-stone">{label}</p>
              <Icon className="h-4 w-4 text-clay" />
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">{value}</p>
            <p className="mt-1 text-xs text-stone">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Traffic */}
      <section id="traffic" className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-line bg-paper p-6 xl:col-span-2">
          <h2 className="font-display text-lg font-semibold text-ink">Website traffic</h2>
          <p className="mb-4 text-sm text-stone">Visitors and page views per day, {periodText}.</p>
          <TrendChart labels={labels} series={[{ name: 'Page views', values: traffic.views }, { name: 'Visitors', values: traffic.visitors }]} />
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-paper p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">Devices</h2>
            <SplitBar parts={devices} empty="No visits recorded yet." />
          </div>
          <div className="rounded-2xl border border-line bg-paper p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">Top pages</h2>
            <BarList items={pages} empty="No visits recorded yet." color="#4E86B0" />
          </div>
        </div>
      </section>

      {/* Orders & sales */}
      <section id="sales" className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Sales</h2>
          <p className="mb-4 text-sm text-stone">Product value of orders per day (cancelled/returned excluded).</p>
          <TrendChart labels={labels} series={[{ name: 'Sales', values: orderSeries.sales, color: '#2E8B54' }]} format={taka} width={420} height={240} />
        </div>
        <div className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Orders per day</h2>
          <p className="mb-4 text-sm text-stone">{orderSeries.count.reduce((a, b) => a + b, 0)} orders, {periodText}.</p>
          <ColumnChart labels={labels} values={orderSeries.count} name="Orders" width={420} height={240} />
        </div>
      </section>

      {/* Leads overview: from product interest to delivery */}
      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Leads overview</h2>
          <p className="mb-4 text-sm text-stone">From product interest to delivery, {periodText}. % = share of the step above.</p>
          <BarList items={steps.map((s, i) => ({ ...s, color: ['#4E86B0', '#C99A4E', 'rgb(var(--clay))', '#2E8B54'][i] }))} showRate empty="No activity yet." />
          {steps[1].value === 0 && steps[0].value > 0 && <p className="mt-3 text-xs text-stone">&ldquo;Added to cart&rdquo; counts start from this update.</p>}
        </div>
        <div className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Most viewed products</h2>
          <p className="mb-4 text-sm text-stone">Product page views, {periodText}.</p>
          <BarList items={viewed.map((r) => ({ key: r.id, label: r.name, value: r.views, sub: r.carts ? `· ${r.carts} to cart` : '' }))} empty="No product views yet." />
        </div>
        <div className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Orders by status</h2>
          <p className="mb-4 text-sm text-stone">Orders placed in the {periodText}.</p>
          <BarList items={statusRows.map((s) => ({ key: s.value, label: s.label, value: s.count, color: ORDER_COLORS[s.value] }))} empty="No orders in this period." />
          <Link href="/admin/orders" className="mt-4 inline-block text-xs font-medium text-clay hover:underline">Open orders →</Link>
        </div>
      </section>

      {/* Recent orders + searches */}
      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Recent orders</h2>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone">No orders yet.</p>
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-stone">
                  <tr>
                    <th className="px-2 py-2 font-medium">Order</th>
                    <th className="px-2 py-2 font-medium">When</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 text-right font-medium">COD</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map((o) => (
                    <tr key={o.id} className="border-t border-line align-middle transition-colors hover:bg-line/40">
                      <td className="px-2 py-2"><span className="font-medium text-ink">{o.customer_name || '—'}</span><span className="block text-xs text-stone">{o.order_number}</span></td>
                      <td className="whitespace-nowrap px-2 py-2 text-stone">{fmtDate(o.created_at)}</td>
                      <td className="px-2 py-2"><span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${ORDER_COLORS[o.status] || '#888'}22`, color: ORDER_COLORS[o.status] || '#888' }}>{orderStatusLabel(o.status)}</span></td>
                      <td className="px-2 py-2 text-right text-ink">{formatPrice(o.cod_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="mb-1 font-display text-lg font-semibold text-ink">What people search</h2>
          <p className="mb-4 text-sm text-stone">Shop searches, {periodText}.</p>
          <BarList items={topSearches.map(([q, n]) => ({ label: q, value: n }))} color="#C99A4E" empty="No searches yet." />
        </div>
      </section>

      {/* Inventory alerts + Recent activity */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-clay" />
            <h2 className="font-display text-lg font-semibold text-ink">Inventory alerts</h2>
          </div>
          {outOfStock.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone">Everything is in stock.</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-stone">{outOfStock.length} product{outOfStock.length === 1 ? '' : 's'} made to order (not in stock):</p>
              <ul className="space-y-2">
                {outOfStock.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                    <span className="truncate text-ink">{p.name}</span>
                    <Link href={`/admin/products/${p.id}`} className="shrink-0 text-xs font-medium text-clay hover:underline">Edit</Link>
                  </li>
                ))}
              </ul>
              {outOfStock.length > 8 && <p className="mt-3 text-xs text-stone">+{outOfStock.length - 8} more</p>}
            </>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-paper p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-clay" />
            <h2 className="font-display text-lg font-semibold text-ink">Recent activity</h2>
          </div>
          {activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone">Nothing to show yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.key} className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-line/40">
                  <a.Icon className="mt-0.5 h-4 w-4 shrink-0 text-stone" />
                  <span className="min-w-0 flex-1 truncate text-ink">{a.text}</span>
                  <span className="shrink-0 whitespace-nowrap text-xs text-stone">{fmtDay(a.when)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
