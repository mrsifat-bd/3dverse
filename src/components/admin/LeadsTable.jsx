'use client'
import { useEffect, useMemo, useState } from 'react'
import { Loader2, Trash2, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { getLeads, deleteLead, updateLeadStatus, LEAD_STATUSES } from '@/lib/leads'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'

function fmtDate(d) {
  try {
    return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return d
  }
}

export default function LeadsTable() {
  const [leads, setLeads] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  async function load() {
    setError('')
    try { setLeads(await getLeads()) } catch (e) { setError(e.message); setLeads([]) }
  }
  useEffect(() => { load() }, [])

  const stats = useMemo(() => {
    const l = leads || []
    return { total: l.length, orders: l.filter((x) => x.action === 'order').length, views: l.filter((x) => x.action === 'view').length }
  }, [leads])

  // Top viewed products over 24h / 7d / 30d.
  const analytics = useMemo(() => {
    const now = Date.now()
    const top = (ms) => {
      const cut = now - ms
      const counts = {}
      for (const l of leads || []) {
        if (l.action !== 'view') continue
        if (new Date(l.created_at).getTime() < cut) continue
        const name = l.product_name || '—'
        counts[name] = (counts[name] || 0) + 1
      }
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    }
    const H = 3600e3
    return [
      { label: 'Last 24 hours', rows: top(24 * H) },
      { label: 'Last 7 days', rows: top(7 * 24 * H) },
      { label: 'Last 30 days', rows: top(30 * 24 * H) },
    ]
  }, [leads])

  const visible = (leads || []).filter((l) => filter === 'all' || l.action === filter)

  async function onDelete(id) {
    try { await deleteLead(id); setLeads((prev) => prev.filter((l) => l.id !== id)) } catch (e) { setError(e.message) }
  }

  async function onStatus(id, status) {
    const prev = leads
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, status } : l)))
    try { await updateLeadStatus(id, status) } catch (e) { setLeads(prev); setError(e.message) }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">Leads</h1>
        <div className="flex items-center gap-2">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter">
            <option value="all">All actions</option>
            <option value="order">Orders (Buy Now)</option>
            <option value="view">Product views</option>
          </Select>
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[{ label: 'Total interactions', value: stats.total }, { label: 'Orders (Buy Now)', value: stats.orders }, { label: 'Product views', value: stats.views }].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-paper p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-md hover:shadow-black/5">
            <p className="text-sm text-stone">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Most viewed products</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {analytics.map((win) => (
            <div key={win.label} className="rounded-2xl border border-line bg-paper p-5">
              <p className="mb-3 text-xs uppercase tracking-wide text-stone">{win.label}</p>
              {win.rows.length === 0 ? (
                <p className="text-sm text-stone">No views yet.</p>
              ) : (
                <ol className="space-y-2">
                  {win.rows.map(([name, count], i) => (
                    <li key={name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-clay/10 text-xs font-medium text-clay">{i + 1}</span>
                        <span className="truncate text-ink">{name}</span>
                      </span>
                      <span className="shrink-0 font-medium text-stone">{count} views</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {leads === null ? (
        <div className="flex items-center gap-2 py-16 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper py-16 text-center text-sm text-stone">No leads yet. They appear when customers open a product or tap Buy Now.</div>
      ) : (
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-x-auto rounded-2xl border border-line"
        >
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-stone">
              <tr>
                <th className="p-3 font-medium">When</th>
                <th className="p-3 font-medium">Action</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Product</th>
                <th className="p-3 font-medium">Location</th>
                <th className="p-3 font-medium">Device</th>
                <th className="hidden p-3 font-medium lg:table-cell">IP</th>
                <th className="p-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((l) => (
                <tr key={l.id} className="border-t border-line align-top transition-colors hover:bg-line/40">
                  <td className="whitespace-nowrap p-3 text-stone">{fmtDate(l.created_at)}</td>
                  <td className="p-3">{l.action === 'order' ? <Badge>Order</Badge> : <Badge variant="muted">View</Badge>}</td>
                  <td className="p-3">
                    {l.action === 'order' ? (
                      <Select value={l.status || 'new'} onChange={(e) => onStatus(l.id, e.target.value)} aria-label="Status" className="h-9 px-3 pr-8 text-xs">
                        {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </Select>
                    ) : (
                      <span className="text-stone">—</span>
                    )}
                  </td>
                  <td className="p-3 font-medium text-ink">{l.product_name || '—'}</td>
                  <td className="p-3 text-stone">{[l.city, l.country].filter(Boolean).join(', ') || '—'}</td>
                  <td className="p-3 text-stone">{[l.device, l.browser, l.os].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="hidden p-3 text-stone lg:table-cell">{l.ip || '—'}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => onDelete(l.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  )
}
