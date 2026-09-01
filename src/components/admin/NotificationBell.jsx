'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Loader2, PackageCheck, CheckCheck } from 'lucide-react'
import {
  getAdminNotifications, unreadCount, markNotificationRead,
  markAllNotificationsRead, subscribeAdminNotifications,
} from '@/lib/notifications'

function relativeTime(iso) {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`
  try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) } catch { return '' }
}

export default function NotificationBell() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const wrapRef = useRef(null)

  const load = useCallback(async () => {
    try { setItems(await getAdminNotifications()) } catch {} finally { setLoading(false) }
  }, [])

  // Initial load + realtime stream + a slow poll fallback (covers the case
  // where Realtime is unavailable). De-dupes by id when merging.
  useEffect(() => {
    load()
    const unsub = subscribeAdminNotifications((n) => {
      setItems((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev].slice(0, 30)))
    })
    const poll = setInterval(load, 45000)
    return () => { unsub(); clearInterval(poll) }
  }, [load])

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const unread = unreadCount(items)

  async function openNotification(n) {
    setOpen(false)
    if (!n.read_at) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)))
      try { await markNotificationRead(n.id) } catch {}
    }
    if (n.order_id) router.push(`/admin/orders?order=${n.order_id}`)
  }

  async function markAll() {
    if (!unread) return
    const now = new Date().toISOString()
    setItems((prev) => prev.map((x) => (x.read_at ? x : { ...x, read_at: now })))
    try { await markAllNotificationsRead() } catch {}
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-paper text-ink transition-colors hover:border-clay/40 hover:text-clay"
      >
        <Bell className="h-[18px] w-[18px]" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-[#B4381F] px-1 text-[11px] font-bold leading-none text-white"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-paper shadow-xl shadow-black/5"
            role="menu"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold text-ink">Notifications</span>
              {unread > 0 && (
                <button onClick={markAll} className="inline-flex items-center gap-1 text-xs font-medium text-clay hover:underline">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-stone">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : items.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-line/50 text-stone">
                    <Bell className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-ink">You're all caught up</p>
                  <p className="mt-0.5 text-xs text-stone">New orders will show up here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {items.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => openNotification(n)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-line/40 ${n.read_at ? '' : 'bg-clay/[0.04]'}`}
                      >
                        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${n.read_at ? 'bg-line/60 text-stone' : 'bg-clay/15 text-clay'}`}>
                          <PackageCheck className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-ink">{n.title || 'New order received'}</span>
                            {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-[#B4381F]" aria-label="Unread" />}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-stone">{n.message}</span>
                          <span className="mt-0.5 block text-[11px] text-stone/80">{relativeTime(n.created_at)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
