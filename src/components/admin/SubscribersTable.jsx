'use client'
import { useEffect, useState } from 'react'
import { Loader2, Trash2, Copy, Download, RefreshCw, Check, Users, Mail } from 'lucide-react'
import { getSubscribers, deleteSubscriber, getRegisteredCustomers } from '@/lib/subscribers'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

function csvCell(v) {
  const t = String(v ?? '')
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

function saveCsv(name, header, rows) {
  const blob = new Blob([header.join(',') + '\n' + rows.map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function fmt(d) {
  try {
    return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return d
  }
}

export default function SubscribersTable() {
  const [tab, setTab] = useState('subscribers')
  const [customers, setCustomers] = useState(null)
  const [custErr, setCustErr] = useState('')
  async function loadCustomers() {
    setCustErr('')
    try { setCustomers(await getRegisteredCustomers()) } catch (e) { setCustErr(e.message); setCustomers([]) }
  }
  useEffect(() => { loadCustomers() }, [])
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="People">
        <TabButton active={tab === 'subscribers'} onClick={() => setTab('subscribers')} icon={Mail}>Email subscribers</TabButton>
        <TabButton active={tab === 'customers'} onClick={() => setTab('customers')} icon={Users}>
          Registered customers{customers ? ` (${customers.length})` : ''}
        </TabButton>
      </div>
      {tab === 'subscribers' ? <SubscribersList /> : <CustomersList rows={customers} err={custErr} reload={loadCustomers} />}
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? 'border-clay bg-clay text-paper' : 'border-line text-ink hover:border-clay/40 hover:text-clay'}`}>
      <Icon className="h-4 w-4" /> {children}
    </button>
  )
}

// People who created an account on the site (they may never have subscribed).
function CustomersList({ rows, err, reload }) {
  const [q, setQ] = useState('')
  const s = q.trim().toLowerCase()
  const shown = (rows || []).filter((r) => !s || [r.email, r.full_name, r.phone].some((v) => String(v || '').toLowerCase().includes(s)))
  const buyers = (rows || []).filter((r) => Number(r.order_count) > 0).length
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Registered customers</h1>
          <p className="mt-1 text-sm text-stone">{rows ? `${rows.length} account${rows.length === 1 ? '' : 's'} · ${buyers} placed an order` : 'Loading…'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => saveCsv('3dverse-customers.csv', ['name', 'email', 'phone', 'joined', 'last_login', 'orders', 'last_order', 'email_confirmed'],
            shown.map((r) => [r.full_name, r.email, r.phone, r.created_at, r.last_sign_in_at || '', r.order_count, r.last_order_at || '', r.email_confirmed ? 'yes' : 'no']))}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={reload}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="mb-4 max-w-xs"><Input placeholder="Search name, email or phone…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search customers" /></div>
      {err && <p className="mb-4 text-sm text-destructive">{err}</p>}
      {rows === null ? (
        <div className="flex items-center gap-2 py-16 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper py-16 text-center text-sm text-stone">{rows.length ? 'No customer matches your search.' : 'No accounts yet.'}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-stone">
              <tr>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Phone</th>
                <th className="p-3 font-medium">Joined</th>
                <th className="hidden p-3 font-medium md:table-cell">Last login</th>
                <th className="p-3 text-right font-medium">Orders</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-t border-line transition-colors hover:bg-line/40">
                  <td className="p-3">
                    <p className="font-medium text-ink">{r.full_name || '—'}</p>
                    <p className="text-xs text-stone">{r.email}{!r.email_confirmed && <span className="ml-1.5 rounded-full bg-line/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">unconfirmed</span>}</p>
                  </td>
                  <td className="p-3 text-stone">{r.phone ? <a className="hover:text-clay" href={`tel:${r.phone}`}>{r.phone}</a> : '—'}</td>
                  <td className="p-3 text-stone">{fmt(r.created_at)}</td>
                  <td className="hidden p-3 text-stone md:table-cell">{r.last_sign_in_at ? fmt(r.last_sign_in_at) : 'Never'}</td>
                  <td className="p-3 text-right">
                    <span className={`font-medium ${Number(r.order_count) ? 'text-ink' : 'text-stone'}`}>{Number(r.order_count) || 0}</span>
                    {r.last_order_at && <span className="block text-xs text-stone">last {fmt(r.last_order_at)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SubscribersList() {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)

  async function load() {
    setErr('')
    try { setRows(await getSubscribers()) } catch (e) { setErr(e.message); setRows([]) }
  }
  useEffect(() => { load() }, [])

  function copyAll() {
    const t = (rows || []).map((r) => r.email).join(', ')
    try { navigator.clipboard.writeText(t) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadCsv() {
    const header = 'email,name,source,date\n'
    const body = (rows || []).map((r) => `${r.email},${(r.name || '').replace(/[,\n]/g, ' ')},${r.source || ''},${r.created_at}`).join('\n')
    const blob = new Blob([header + body], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '3dverse-subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function del(id) {
    try { await deleteSubscriber(id); setRows((p) => p.filter((r) => r.id !== id)) } catch (e) { setErr(e.message) }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Subscribers</h1>
          <p className="mt-1 text-sm text-stone">{rows ? `${rows.length} email${rows.length === 1 ? '' : 's'} collected` : 'Loading…'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={copyAll}>{copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy all</>}</Button>
          <Button variant="ghost" onClick={downloadCsv}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {err && <p className="mb-4 text-sm text-destructive">{err}</p>}

      {rows === null ? (
        <div className="flex items-center gap-2 py-16 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper py-16 text-center text-sm text-stone">No subscribers yet. They appear when visitors join your list.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-stone">
              <tr>
                <th className="p-3 font-medium">Email</th>
                <th className="hidden p-3 font-medium sm:table-cell">Source</th>
                <th className="hidden p-3 font-medium sm:table-cell">Joined</th>
                <th className="p-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line transition-colors hover:bg-line/40">
                  <td className="p-3 font-medium text-ink">{r.email}</td>
                  <td className="hidden p-3 text-stone sm:table-cell">{r.source || '—'}</td>
                  <td className="hidden p-3 text-stone sm:table-cell">{fmt(r.created_at)}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
