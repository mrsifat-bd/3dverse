'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Package, CheckCircle, XCircle, UserPlus, Clock, Mail, Plus, RefreshCw, Loader2,
  Eye, MessageCircle, Search, Users, LayoutGrid, AlertTriangle, Activity, Settings, ExternalLink, ShoppingBag,
} from 'lucide-react'
import { listProducts } from '@/lib/adminProducts'
import { getLeads, updateLeadStatus, LEAD_STATUSES } from '@/lib/leads'
import { getSubscribers } from '@/lib/subscribers'
import { getPageViews, getSearches } from '@/lib/analytics'
import { CATEGORIES, categoryName } from '@/lib/config'
import { firstImage } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import LeadsChart from './LeadsChart'

const DAY = 86400000

const STATUS_META = {
  new: { label: 'New', color: '#C0603A' },
  contacted: { label: 'Contacted', color: '#C99A4E' },
  confirmed: { label: 'Confirmed', color: '#4E86B0' },
  completed: { label: 'Completed', color: '#5B8A5B' },
  cancelled: { label: 'Cancelled', color: '#9A6A62' },
}
const CHART_STATUSES = LEAD_STATUSES.map((s) => ({ ...s, color: STATUS_META[s.value]?.color || '#888' }))
const OPEN_STATUSES = ['new', 'contacted', 'confirmed']

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

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.new
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: `${m.color}22`, color: m.color }}
    >
      {m.label}
    </span>
  )
}

export default function AdminDashboard() {
  const [products, setProducts] = useState(null)
  const [leads, setLeads] = useState([])
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
    const [prod, lds, subs, pv, sr] = await Promise.allSettled([
      listProducts(),
      getLeads(),
      getSubscribers(),
      getPageViews(),
      getSearches(),
    ])
    if (prod.status === 'fulfilled') setProducts(prod.value)
    else { setError(prod.reason?.message || 'Failed to load products'); setProducts([]) }
    setLeads(lds.status === 'fulfilled' ? lds.value : [])
    setSubscribers(subs.status === 'fulfilled' ? subs.value : [])
    // page_views / search_queries may not exist until the migration is run.
    const pvOk = pv.status === 'fulfilled'
    const srOk = sr.status === 'fulfilled'
    setPageViews(pvOk ? pv.value : [])
    setSearches(srOk ? sr.value : [])
    setAnalyticsWarning(!pvOk || !srOk ? 'Visitor & search analytics are unavailable — run the dashboard migration to enable them.' : '')
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  const orderLeads = useMemo(() => leads.filter((l) => l.action === 'order'), [leads])
  const viewEvents = useMemo(() => leads.filter((l) => l.action === 'view'), [leads])

  const kpis = useMemo(() => {
    const p = products || []
    const newSubs = within(subscribers, 'created_at', 7).length
    return {
      total: p.length,
      inStock: p.filter((x) => x.in_stock).length,
      outStock: p.filter((x) => !x.in_stock).length,
      newLeads: orderLeads.filter((l) => (l.status || 'new') === 'new').length,
      pending: orderLeads.filter((l) => OPEN_STATUSES.includes(l.status || 'new')).length,
      totalLeads: orderLeads.length,
      subscribers: subscribers.length,
      newSubs,
    }
  }, [products, orderLeads, subscribers])

  const buckets = useMemo(() => {
    const startToday = new Date(); startToday.setHours(0, 0, 0, 0)
    const todayMs = startToday.getTime()
    if (period <= 30) {
      const n = period
      const arr = Array.from({ length: n }, (_, i) => {
        const d = new Date(todayMs - (n - 1 - i) * DAY)
        return { label: period === 7 ? d.toLocaleDateString('en-GB', { weekday: 'short' }) : String(d.getDate()), counts: {}, total: 0 }
      })
      for (const l of orderLeads) {
        const t = new Date(l.created_at); t.setHours(0, 0, 0, 0)
        const idx = n - 1 - Math.round((todayMs - t.getTime()) / DAY)
        if (idx < 0 || idx >= n) continue
        const s = l.status || 'new'
        arr[idx].counts[s] = (arr[idx].counts[s] || 0) + 1
        arr[idx].total++
      }
      return arr
    }
    const weeks = 13
    const arr = Array.from({ length: weeks }, (_, i) => {
      const d = new Date(todayMs - (weeks - 1 - i) * 7 * DAY)
      return { label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), counts: {}, total: 0 }
    })
    for (const l of orderLeads) {
      const t = new Date(l.created_at); t.setHours(0, 0, 0, 0)
      const ageDays = Math.round((todayMs - t.getTime()) / DAY)
      const idx = weeks - 1 - Math.floor(ageDays / 7)
      if (idx < 0 || idx >= weeks) continue
      const s = l.status || 'new'
      arr[idx].counts[s] = (arr[idx].counts[s] || 0) + 1
      arr[idx].total++
    }
    return arr
  }, [orderLeads, period])

  const topProducts = useMemo(() => {
    const map = new Map()
    for (const l of leads) {
      const id = String(l.product_id || '')
      if (!id) continue
      const e = map.get(id) || { views: 0, leads: 0 }
      if (l.action === 'view') e.views++
      else if (l.action === 'order') e.leads++
      map.set(id, e)
    }
    const rows = (products || []).map((p) => {
      const e = map.get(String(p.id)) || { views: 0, leads: 0 }
      return { id: p.id, name: p.name, category: p.category, image: firstImage(p), in_stock: p.in_stock, views: e.views, leads: e.leads }
    })
    rows.sort((a, b) => b.views - a.views || b.leads - a.leads)
    return rows
  }, [leads, products])

  const outOfStock = useMemo(() => (products || []).filter((p) => !p.in_stock), [products])

  const activity = useMemo(() => {
    const items = []
    for (const p of products || []) items.push({ key: 'p' + p.id, when: p.created_at, text: `Product added — ${p.name}`, Icon: Package })
    for (const l of orderLeads) items.push({ key: 'l' + l.id, when: l.created_at, text: `New lead — ${l.product_name || 'product'}`, Icon: MessageCircle })
    for (const s of subscribers) items.push({ key: 's' + s.id, when: s.created_at, text: `New subscriber — ${s.email}`, Icon: Mail })
    items.sort((a, b) => new Date(b.when) - new Date(a.when))
    return items.slice(0, 8)
  }, [products, orderLeads, subscribers])

  const web = useMemo(() => {
    const pv = within(pageViews, 'created_at', 30)
    const visitors = new Set(pv.map((v) => v.visitor_id).filter(Boolean)).size
    const counts = {}
    for (const s of within(searches, 'created_at', 30)) {
      const q = (s.query || '').trim().toLowerCase()
      if (q) counts[q] = (counts[q] || 0) + 1
    }
    const topSearches = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    return {
      visitors,
      pageViews: pv.length,
      productViews: within(viewEvents, 'created_at', 30).length,
      whatsapp: within(orderLeads, 'created_at', 30).length,
      searchCount: within(searches, 'created_at', 30).length,
      topSearches,
    }
  }, [pageViews, searches, viewEvents, orderLeads])

  const changeStatus = useCallback(async (id, status) => {
    const prev = leads
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, status } : l)))
    try {
      await updateLeadStatus(id, status)
    } catch (e) {
      setLeads(prev)
      setError(e.message || 'Could not update status')
    }
  }, [leads])

  if (products === null) {
    return (
      <div className="flex items-center gap-2 py-24 text-stone">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading dashboard…
      </div>
    )
  }

  const kpiCards = [
    { label: 'Total products', value: kpis.total, sub: `${CATEGORIES.length} categories`, Icon: Package, href: '/admin/products' },
    { label: 'In stock', value: kpis.inStock, sub: 'available now', Icon: CheckCircle, href: '/admin/products' },
    { label: 'Out of stock', value: kpis.outStock, sub: kpis.outStock ? 'needs attention' : 'all stocked', Icon: XCircle, href: '/admin/products' },
    { label: 'New leads', value: kpis.newLeads, sub: `of ${kpis.totalLeads} total`, Icon: UserPlus, href: '/admin/leads' },
    { label: 'Pending leads', value: kpis.pending, sub: 'open pipeline', Icon: Clock, href: '/admin/leads' },
    { label: 'Subscribers', value: kpis.subscribers, sub: kpis.newSubs ? `+${kpis.newSubs} this week` : 'mailing list', Icon: Mail, href: '/admin/subscribers' },
  ]

  const webCards = [
    { label: 'Visitors', value: web.visitors, Icon: Users },
    { label: 'Page views', value: web.pageViews, Icon: LayoutGrid },
    { label: 'Product views', value: web.productViews, Icon: Eye },
    { label: 'WhatsApp clicks', value: web.whatsapp, Icon: MessageCircle },
    { label: 'Searches', value: web.searchCount, Icon: Search },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-stone">Overview of your store, leads and traffic.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={load} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild><Link href="/admin/products/new"><Plus className="h-4 w-4" /> New product</Link></Button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      {/* Quick actions */}
      <div className="fade-up mb-6 flex flex-wrap gap-3">
        <Button asChild variant="ghost" size="sm"><Link href="/admin/products/new"><Plus className="h-4 w-4" /> Add product</Link></Button>
        <Button asChild variant="ghost" size="sm"><Link href="/admin/products"><Package className="h-4 w-4" /> Manage products</Link></Button>
        <Button asChild variant="ghost" size="sm"><Link href="/admin/orders"><ShoppingBag className="h-4 w-4" /> Orders</Link></Button>
        <Button asChild variant="ghost" size="sm"><Link href="/admin/leads"><UserPlus className="h-4 w-4" /> View leads</Link></Button>
        <Button asChild variant="ghost" size="sm"><Link href="/admin/subscribers"><Mail className="h-4 w-4" /> Subscribers</Link></Button>
        <Button asChild variant="ghost" size="sm"><Link href="/admin/settings"><Settings className="h-4 w-4" /> Settings</Link></Button>
        <Button asChild variant="ghost" size="sm"><Link href="/" target="_blank"><ExternalLink className="h-4 w-4" /> View live site</Link></Button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map(({ label, value, sub, Icon, href }, i) => (
          <Link
            key={label}
            href={href}
            style={{ animationDelay: `${i * 50}ms` }}
            className="fade-up rounded-2xl border border-line bg-paper p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-md hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/50"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-stone">{label}</p>
              <Icon className="h-5 w-5 text-clay" />
            </div>
            <p className="mt-3 font-display text-3xl font-semibold text-ink">{value}</p>
            <p className="mt-1 text-xs text-stone">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Leads overview chart */}
      <div className="mt-6 rounded-2xl border border-line bg-paper p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Leads overview</h2>
            <p className="text-sm text-stone">WhatsApp order leads by status.</p>
          </div>
          <div className="flex gap-1 rounded-full border border-line p-1">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/50 ${period === d ? 'bg-clay text-white' : 'text-stone hover:text-ink'}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <LeadsChart buckets={buckets} statuses={CHART_STATUSES} />
      </div>

      {/* Recent leads + Top products */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Recent leads</h2>
          {orderLeads.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone">No leads yet. They appear when a customer taps Buy Now on WhatsApp.</p>
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-stone">
                  <tr>
                    <th className="px-2 py-2 font-medium">Product</th>
                    <th className="px-2 py-2 font-medium">When</th>
                    <th className="hidden px-2 py-2 font-medium sm:table-cell">Location</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orderLeads.slice(0, 8).map((l) => (
                    <tr key={l.id} className="border-t border-line align-middle transition-colors hover:bg-line/40">
                      <td className="px-2 py-2 font-medium text-ink">{l.product_name || '—'}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-stone">{fmtDate(l.created_at)}</td>
                      <td className="hidden px-2 py-2 text-stone sm:table-cell">{[l.city, l.country].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-2 py-2">
                        <Select
                          value={l.status || 'new'}
                          onChange={(e) => changeStatus(l.id, e.target.value)}
                          aria-label="Lead status"
                          className="h-9 px-3 pr-8 text-xs"
                        >
                          {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Top products</h2>
          {topProducts.length === 0 || topProducts.every((p) => p.views === 0 && p.leads === 0) ? (
            <p className="py-8 text-center text-sm text-stone">No product activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {topProducts.slice(0, 6).map((p, i) => (
                <li key={p.id} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-line/40">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-clay/10 text-xs font-medium text-clay">{i + 1}</span>
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line bg-cream">
                    {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                    <p className="truncate text-xs text-stone">{categoryName(p.category)}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-stone">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {p.views}</span>
                    <span className="ml-3 inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {p.leads}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Inventory alerts + Recent activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-clay" />
            <h2 className="font-display text-lg font-semibold text-ink">Inventory alerts</h2>
          </div>
          {outOfStock.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone">Everything is in stock. 🎉</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-stone">{outOfStock.length} product{outOfStock.length === 1 ? '' : 's'} out of stock:</p>
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

      {/* Website overview */}
      <div className="mt-6 rounded-2xl border border-line bg-paper p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Website overview</h2>
          <span className="text-xs text-stone">Last 30 days</span>
        </div>
        {analyticsWarning && (
          <p className="mb-4 rounded-xl border border-clay/30 bg-clay/5 p-3 text-xs text-stone">{analyticsWarning}</p>
        )}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {webCards.map(({ label, value, Icon }) => (
            <div key={label} className="rounded-xl border border-line p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-clay/30">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone">{label}</p>
                <Icon className="h-4 w-4 text-clay" />
              </div>
              <p className="mt-2 font-display text-2xl font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>
        {web.topSearches.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs uppercase tracking-wide text-stone">Top searches</p>
            <div className="flex flex-wrap gap-2">
              {web.topSearches.map(([q, n]) => (
                <span key={q} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-ink">
                  {q} <span className="text-stone">{n}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
