'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from '@/components/LocalizedLink'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { Loader2, Package, ChevronDown, ExternalLink, XCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLang, useT, useLocalizedRouter } from '@/i18n/client'
import {
  getMyOrders, getOrderEvents, steadfastStatusLabel, trackingUrlFor, cancelMyOrder, canCustomerCancel,
} from '@/lib/orders'
import { formatPrice, formatDate, formatNumber, localized } from '@/lib/format'
import { fade, dialog } from '@/lib/motion'
import { Button } from '@/components/ui/button'

const PAY_COLOR = { pending: '#C99A4E', verified: '#5B8A5B', rejected: '#9A6A62' }
const PAY_KEY = { pending: 'orders.payPending', verified: 'orders.payVerified', rejected: 'orders.payRejected' }

export default function MyOrdersPage() {
  const { user, loading } = useAuth()
  const router = useLocalizedRouter()
  const t = useT()
  const lang = useLang()
  const [orders, setOrders] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [events, setEvents] = useState([])
  const [confirming, setConfirming] = useState(null) // order awaiting confirmation
  const [cancelBusy, setCancelBusy] = useState(false)
  const [notice, setNotice] = useState(null) // { kind: 'ok' | 'error', text, orderId }

  const reload = useCallback(() => getMyOrders().then(setOrders).catch(() => setOrders([])), [])

  useEffect(() => { if (!loading && !user) router.replace('/login?next=/account/orders') }, [loading, user, router])
  useEffect(() => { if (user) reload() }, [user, reload])

  async function toggle(o) {
    if (openId === o.id) { setOpenId(null); return }
    setOpenId(o.id); setEvents([])
    try { setEvents(await getOrderEvents(o.id)) } catch {}
  }

  async function doCancel() {
    const order = confirming
    if (!order || cancelBusy) return // one request at a time
    setCancelBusy(true)
    const r = await cancelMyOrder(order.id)
    setCancelBusy(false)
    setConfirming(null)
    if (r.ok) {
      // Update the order on screen right away, then re-read from the server.
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'cancelled', cancelled_by: o.cancelled_by || 'customer', cancelled_at: o.cancelled_at || new Date().toISOString() } : o)))
      setNotice({ kind: 'ok', orderId: order.id, text: t('orders.cancelDone', { n: order.order_number }) })
      if (openId === order.id) { try { setEvents(await getOrderEvents(order.id)) } catch {} }
      reload()
      return
    }
    const key = r.code === 'NOT_CANCELLABLE' ? 'orders.cancelTooLate' : r.code === 'NOT_AUTHENTICATED' ? 'orders.cancelLogin' : 'orders.cancelFailed'
    setNotice({ kind: 'error', orderId: order.id, text: t(key) })
    reload() // the order may have been verified meanwhile: show its real status
  }

  if (loading || !user || orders === null) {
    return <div className="container flex items-center gap-2 py-24 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> {t('common.loading')}</div>
  }

  return (
    <div className="container py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">{t('account.orders')}</h1>

      <AnimatePresence>
        {notice && (
          <m.div
            key={notice.text}
            {...fade}
            role={notice.kind === 'error' ? 'alert' : 'status'}
            className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 text-sm ${notice.kind === 'ok' ? 'border-[#5B8A5B]/30 bg-[#5B8A5B]/10 text-ink' : 'border-destructive/30 bg-destructive/5 text-destructive'}`}
          >
            {notice.kind === 'ok' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5B8A5B]" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            <span className="flex-1">{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} className="text-xs underline-offset-2 hover:underline">{t('common.close')}</button>
          </m.div>
        )}
      </AnimatePresence>

      {orders.length === 0 ? (
        <div className="enter mt-8 rounded-2xl border border-dashed border-line bg-paper py-16 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-clay/10 text-clay"><Package className="h-6 w-6" /></span>
          <p className="mt-4 text-sm text-stone">{t('orders.empty')}</p>
          <Link href="/shop" className="btn-primary mt-5">{t('cart.browse')}</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {orders.map((o) => {
            const open = openId === o.id
            const cancelled = o.status === 'cancelled'
            const payColor = PAY_COLOR[o.payment_status] || '#C99A4E'
            const cancellable = canCustomerCancel(o)
            return (
              <div key={o.id} className={`overflow-hidden rounded-2xl border bg-paper transition-colors duration-300 ${cancelled ? 'border-line/70' : 'border-line'}`}>
                <button onClick={() => toggle(o)} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-line/40">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-semibold text-ink" lang="en">{o.order_number}</span>
                      {/* key: the badge re-animates when the status changes */}
                      <span key={o.status} className={`pop rounded-full px-2.5 py-1 text-xs font-medium ${cancelled ? 'bg-line/70 text-stone' : 'bg-clay/10 text-clay'}`}>{t(`orders.status.${o.status}`)}</span>
                      {!cancelled && (
                        <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${payColor}22`, color: payColor }}>{t(PAY_KEY[o.payment_status] || 'orders.payPending')}</span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-stone">
                      {(o.items || []).map((i) => `${localized(i, 'name', lang)} ×${formatNumber(i.qty, lang)}`).join(', ')} · {formatDate(o.created_at, lang, { time: true })}
                    </p>
                  </div>
                  <span className="shrink-0 text-right"><span className={`block font-semibold ${cancelled ? 'text-stone line-through' : 'text-ink'}`}>{formatPrice(o.cod_amount, lang)}</span><span className="text-xs text-stone">{t('common.cod')}</span></span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-stone transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="border-t border-line">
                      <div className="grid gap-6 p-5 sm:grid-cols-2">
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-stone">{t('orders.deliveryTo')}</p>
                            <p className="mt-1 text-ink">{o.customer_name} · {o.customer_phone}</p>
                            <p className="text-stone">{o.customer_address}</p>
                          </div>
                          <div className="rounded-xl border border-line p-3">
                            <div className="flex justify-between"><span className="text-stone">{t('checkout.subtotalCod')}</span><span className="text-ink">{formatPrice(o.cod_amount, lang)}</span></div>
                            <div className="flex justify-between"><span className="text-stone">{t('orders.deliveryBkash')}</span><span className="text-ink">{formatPrice(o.delivery_charge, lang)}</span></div>
                          </div>

                          {cancelled && (
                            <div className="enter rounded-xl border border-line bg-cream/60 p-3 text-xs leading-relaxed text-stone">
                              <p className="font-medium text-ink">
                                {o.cancelled_by === 'customer' ? t('orders.cancelledByYou') : t('orders.cancelledByUs')}
                                {o.cancelled_at ? ` · ${formatDate(o.cancelled_at, lang, { time: true })}` : ''}
                              </p>
                              <p className="mt-1">{t('orders.refundNote')} <Link href="/refund-policy" className="text-clay hover:underline">{t('footer.refunds')}</Link></p>
                            </div>
                          )}

                          {!cancelled && o.payment_status === 'rejected' && (
                            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{t('orders.paymentRejected')}</p>
                          )}
                          {o.steadfast_tracking_code && (
                            <div className="rounded-xl border border-line p-3">
                              <div className="flex justify-between"><span className="text-stone">{t('orders.courier')}</span><span className="text-ink">Steadfast · {steadfastStatusLabel(o.steadfast_status)}</span></div>
                              <div className="mt-1 flex justify-between"><span className="text-stone">{t('orders.tracking')}</span><span className="font-medium text-ink" lang="en">{o.steadfast_tracking_code}</span></div>
                              <a href={trackingUrlFor(o.steadfast_tracking_code)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-clay hover:underline"><ExternalLink className="h-3.5 w-3.5" /> {t('orders.trackSteadfast')}</a>
                            </div>
                          )}

                          {cancellable && (
                            <div className="rounded-xl border border-line p-3">
                              <p className="text-xs leading-relaxed text-stone">{t('orders.cancelHelp')}</p>
                              <Button type="button" variant="ghost" className="mt-3 w-full border-destructive/40 text-destructive hover:border-destructive hover:text-destructive" onClick={() => { setNotice(null); setConfirming(o) }}>
                                <XCircle className="h-4 w-4" /> {t('orders.cancelButton')}
                              </Button>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-stone">{t('orders.timeline')}</p>
                          <ul className="mt-2 space-y-2 text-sm">
                            <li className="flex gap-2 text-stone"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" /> {t('orders.placed')} · {formatDate(o.created_at, lang, { time: true })}</li>
                            {events.map((ev) => (
                              // Timeline notes are written by our team (English) and shown as written.
                              <li key={ev.id} className="enter flex gap-2 text-stone"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay/50" /> <span lang="en">{ev.message}</span> · {formatDate(ev.created_at, lang, { time: true })}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
      <p className="mt-8 text-sm"><Link href="/account" className="text-clay hover:underline">← {t('account.backToAccount')}</Link></p>

      <CancelDialog order={confirming} busy={cancelBusy} onConfirm={doCancel} onClose={() => !cancelBusy && setConfirming(null)} t={t} lang={lang} />
    </div>
  )
}

// Confirmation before cancelling: role=alertdialog, focus starts on the safe
// choice ("Keep order"), Escape closes, Tab stays inside, focus returns after.
function CancelDialog({ order, busy, onConfirm, onClose, t, lang }) {
  const keepRef = useRef(null)
  const boxRef = useRef(null)
  // Latest onClose without re-running the effect on every render (which would
  // re-focus "Keep order" and lose the element to return focus to).
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const isOpen = Boolean(order)

  useEffect(() => {
    if (!isOpen) return
    const prev = document.activeElement
    keepRef.current?.focus()
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current() }
      if (e.key === 'Tab' && boxRef.current) {
        const f = boxRef.current.querySelectorAll('button:not([disabled])')
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [isOpen])

  return (
    <AnimatePresence>
      {order && (
        <div key="cancel-dialog" className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
          <m.div {...fade} className="absolute inset-0 bg-ink/40" onClick={onClose} />
          <m.div
            {...dialog}
            ref={boxRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
            aria-describedby="cancel-desc"
            className="relative w-full max-w-md rounded-3xl border border-line bg-paper p-6 shadow-2xl"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-destructive/10 text-destructive"><XCircle className="h-5 w-5" /></span>
            <h2 id="cancel-title" className="mt-4 font-display text-xl font-semibold text-ink">{t('orders.confirmTitle')}</h2>
            <div id="cancel-desc" className="mt-2 space-y-2 text-sm leading-relaxed text-stone">
              <p>{t('orders.confirmText', { n: order.order_number, amount: formatPrice(order.cod_amount, lang) })}</p>
              <p>{t('orders.confirmRefund')}</p>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button ref={keepRef} type="button" variant="ghost" onClick={onClose} disabled={busy}>{t('orders.keepOrder')}</Button>
              <Button type="button" onClick={onConfirm} disabled={busy} className="bg-destructive text-white hover:bg-destructive/90">
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('orders.cancelling')}</> : t('orders.confirmCancel')}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  )
}
