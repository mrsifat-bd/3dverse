'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Package, ChevronDown, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getMyOrders, getOrderEvents, orderStatusLabel, steadfastStatusLabel, trackingUrlFor } from '@/lib/orders'
import { formatPrice } from '@/lib/format'

const PAY_LABEL = { pending: 'Payment verification pending', verified: 'Payment verified', rejected: 'Payment rejected' }
const PAY_COLOR = { pending: '#C99A4E', verified: '#5B8A5B', rejected: '#9A6A62' }

function fmt(d) { try { return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return d } }

export default function MyOrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [events, setEvents] = useState([])

  useEffect(() => { if (!loading && !user) router.replace('/login?next=/account/orders') }, [loading, user, router])
  useEffect(() => { if (!user) return; getMyOrders().then(setOrders).catch(() => setOrders([])) }, [user])

  async function toggle(o) {
    if (openId === o.id) { setOpenId(null); return }
    setOpenId(o.id); setEvents([])
    try { setEvents(await getOrderEvents(o.id)) } catch {}
  }

  if (loading || !user || orders === null) {
    return <div className="container flex items-center gap-2 py-24 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
  }

  return (
    <div className="container py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">My Orders</h1>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-paper py-16 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-clay/10 text-clay"><Package className="h-6 w-6" /></span>
          <p className="mt-4 text-sm text-stone">No orders yet.</p>
          <Link href="/shop" className="btn-primary mt-5">Browse products</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {orders.map((o) => {
            const open = openId === o.id
            const payColor = PAY_COLOR[o.payment_status] || '#C99A4E'
            return (
              <div key={o.id} className="overflow-hidden rounded-2xl border border-line bg-paper">
                <button onClick={() => toggle(o)} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-line/40">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-semibold text-ink">{o.order_number}</span>
                      <span className="rounded-full bg-clay/10 px-2.5 py-1 text-xs font-medium text-clay">{orderStatusLabel(o.status)}</span>
                      <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${payColor}22`, color: payColor }}>{PAY_LABEL[o.payment_status] || o.payment_status}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-stone">{(o.items || []).map((i) => `${i.name} ×${i.qty}`).join(', ')} · {fmt(o.created_at)}</p>
                  </div>
                  <span className="shrink-0 text-right"><span className="block font-semibold text-ink">{formatPrice(o.cod_amount)}</span><span className="text-xs text-stone">COD</span></span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-stone transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="border-t border-line">
                      <div className="grid gap-6 p-5 sm:grid-cols-2">
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-stone">Delivery to</p>
                            <p className="mt-1 text-ink">{o.customer_name} · {o.customer_phone}</p>
                            <p className="text-stone">{o.customer_address}</p>
                          </div>
                          <div className="rounded-xl border border-line p-3">
                            <div className="flex justify-between"><span className="text-stone">Product total (COD)</span><span className="text-ink">{formatPrice(o.cod_amount)}</span></div>
                            <div className="flex justify-between"><span className="text-stone">Delivery (bKash)</span><span className="text-ink">{formatPrice(o.delivery_charge)}</span></div>
                          </div>
                          {o.payment_status === 'rejected' && (
                            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">Your delivery payment was rejected. Please contact us to resolve it.</p>
                          )}
                          {o.steadfast_tracking_code && (
                            <div className="rounded-xl border border-line p-3">
                              <div className="flex justify-between"><span className="text-stone">Courier</span><span className="text-ink">Steadfast · {steadfastStatusLabel(o.steadfast_status)}</span></div>
                              <div className="mt-1 flex justify-between"><span className="text-stone">Tracking</span><span className="font-medium text-ink">{o.steadfast_tracking_code}</span></div>
                              <a href={trackingUrlFor(o.steadfast_tracking_code)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-clay hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Track on Steadfast</a>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-stone">Timeline</p>
                          <ul className="mt-2 space-y-2 text-sm">
                            <li className="flex gap-2 text-stone"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" /> Order placed · {fmt(o.created_at)}</li>
                            {events.map((ev) => (
                              <li key={ev.id} className="flex gap-2 text-stone"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay/50" /> {ev.message} · {fmt(ev.created_at)}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
      <p className="mt-8 text-sm"><Link href="/account" className="text-clay hover:underline">← Back to account</Link></p>
    </div>
  )
}
