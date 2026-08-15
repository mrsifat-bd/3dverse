'use client'
import { useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Check, X, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getAllComments, moderateComment, deleteComment } from '@/lib/social'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

const STATUS_META = {
  pending: { label: 'Pending', color: '#C99A4E' },
  approved: { label: 'Approved', color: '#5B8A5B' },
  rejected: { label: 'Rejected', color: '#9A6A62' },
}
function fmt(d) { try { return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return d } }

export default function CommentsTable() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('pending')
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setError('')
    try { setRows(await getAllComments()) } catch (e) { setError(e.message); setRows([]) }
  }
  useEffect(() => { load() }, [])

  const visible = useMemo(() => (rows || []).filter((r) => filter === 'all' || r.status === filter), [rows, filter])

  async function adminEmail() {
    const { data } = await supabase.auth.getSession()
    return data?.session?.user?.email || ''
  }

  async function act(row, action) {
    setBusyId(row.id); setError('')
    try {
      if (action === 'delete') {
        if (!window.confirm('Delete this review permanently?')) { setBusyId(null); return }
        await deleteComment(row.id)
        setRows((p) => p.filter((r) => r.id !== row.id))
      } else {
        await moderateComment(row.id, action, await adminEmail())
        setRows((p) => p.map((r) => (r.id === row.id ? { ...r, status: action } : r)))
      }
    } catch (e) { setError(e.message) } finally { setBusyId(null) }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Reviews</h1>
          <p className="mt-1 text-sm text-stone">Approve, reject or delete customer reviews.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </Select>
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      {rows === null ? (
        <div className="flex items-center gap-2 py-16 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper py-16 text-center text-sm text-stone">No {filter === 'all' ? '' : filter} reviews.</div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => {
            const m = STATUS_META[r.status] || STATUS_META.pending
            return (
              <div key={r.id} className="rounded-2xl border border-line bg-paper p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-ink">{r.user_name || 'Customer'}</span>
                    <span className="text-stone">on</span>
                    <span className="font-medium text-ink">{r.products?.name || 'product'}</span>
                    <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${m.color}22`, color: m.color }}>{m.label}</span>
                  </div>
                  <span className="text-xs text-stone">{fmt(r.created_at)}</span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone">{r.comment}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status !== 'approved' && <Button size="sm" onClick={() => act(r, 'approved')} disabled={busyId === r.id}><Check className="h-3.5 w-3.5" /> Approve</Button>}
                  {r.status !== 'rejected' && <Button size="sm" variant="ghost" onClick={() => act(r, 'rejected')} disabled={busyId === r.id}><X className="h-3.5 w-3.5" /> Reject</Button>}
                  <Button size="sm" variant="ghost" onClick={() => act(r, 'delete')} disabled={busyId === r.id}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
