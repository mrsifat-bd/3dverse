'use client'
import { useEffect, useState } from 'react'
import { Loader2, Trash2, Copy, Download, RefreshCw, Check } from 'lucide-react'
import { getSubscribers, deleteSubscriber } from '@/lib/subscribers'
import { Button } from '@/components/ui/button'

function fmt(d) {
  try {
    return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return d
  }
}

export default function SubscribersTable() {
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
