'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Check, Truck } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { formatPrice, formatDate, formatNumber } from '@/lib/format'
import { useLang, useT } from '@/i18n/client'
import { trackingUrlFor } from '@/lib/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Customer-facing progress, in the order an order moves through.
const STEPS = ['placed', 'confirmed', 'printing', 'shipped', 'delivered']
const STEP_OF = { new: 0, confirmed: 1, ready: 2, sent_to_steadfast: 3, shipped: 3, delivered: 4 }
const ENDED = new Set(['cancelled', 'returned', 'failed'])

export default function TrackOrder() {
  const params = useSearchParams()
  const t = useT()
  const lang = useLang()
  const money = (v) => formatPrice(v, lang)
  const [number, setNumber] = useState(params.get('n') || '')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(''); setOrder(null)
    const p = phone.replace(/\D/g, '').slice(-11)
    if (!number.trim()) { setError(t('track.needNumber')); return }
    if (!/^01\d{9}$/.test(p)) { setError(t('track.needPhone')); return }
    if (!isSupabaseConfigured) { setError(t('track.unavailable')); return }
    setBusy(true)
    const { data, error: err } = await supabase.rpc('track_order', { p_order_number: number.trim(), p_phone: p })
    setBusy(false)
    if (err) { setError(t('track.failed')); return }
    if (!data) { setError(t('track.notFound')); return }
    setOrder(data)
  }

  const ended = order && ENDED.has(order.status)
  const current = order ? (STEP_OF[order.status] ?? 0) : 0
  const paymentRejected = order?.payment_status === 'rejected'

  return (
    <div className="mt-8">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-paper p-6">
        <div className="space-y-1.5">
          <Label htmlFor="ordno">{t('track.orderNumber')}</Label>
          <Input id="ordno" value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} placeholder={t('track.numberPlaceholder')} autoComplete="off" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ordphone">{t('track.phone')}</Label>
          <Input id="ordphone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" autoComplete="tel" />
        </div>
        {error && <p role="alert" className="enter text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('track.checking')}</> : t('track.button')}</Button>
      </form>

      {order && (
        <div className="enter mt-8 rounded-2xl border border-line bg-paper p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-semibold text-ink">{t('success.order')} <span lang="en">{order.order_number}</span></h2>
            <span className="text-xs text-stone">{t('track.placedOn', { date: formatDate(order.created_at, lang) })}</span>
          </div>

          {ended ? (
            <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-ink">{t('track.ended', { status: t(`orders.status.${order.status}`) })}</p>
          ) : (
            <ol className="mt-6 space-y-4">
              {STEPS.map((key, i) => {
                const done = i < current || (i === current && order.status === 'delivered')
                const active = i === current && order.status !== 'delivered'
                return (
                  <li key={key} className="enter flex items-center gap-3" style={{ '--enter-delay': `${i * 60}ms` }} aria-current={active ? 'step' : undefined}>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${done ? 'bg-clay text-paper' : active ? 'border-2 border-clay text-clay' : 'border border-line text-stone'}`}>
                      {done ? <Check className="h-4 w-4" /> : formatNumber(i + 1, lang)}
                    </span>
                    <span className={`text-sm ${done || active ? 'font-medium text-ink' : 'text-stone'}`}>{t(`track.step.${key}`)}</span>
                  </li>
                )
              })}
            </ol>
          )}

          {paymentRejected && !ended && (
            <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-ink">{t('track.payRejected')}</p>
          )}
          {order.payment_status === 'pending' && !ended && (
            <p className="mt-4 text-xs text-stone">{t('track.payPending')}</p>
          )}

          {order.tracking_code && (
            <a href={trackingUrlFor(order.tracking_code)} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-5 w-full">
              <Truck className="h-4 w-4" /> {t('track.courier')} <span lang="en">{order.tracking_code}</span>
            </a>
          )}

          <ul className="mt-6 divide-y divide-line border-t border-line text-sm">
            {(order.items || []).map((it, i) => (
              <li key={i} className="flex justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate text-ink">{it.name} <span className="text-stone">× {formatNumber(it.qty, lang)}</span></span>
                <span className="shrink-0 text-ink">{money(Number(it.unit_price) * Number(it.qty))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-stone"><span>{t('orders.deliveryBkash')}</span><span className="text-ink">{money(order.delivery_charge)}</span></div>
            <div className="flex justify-between font-semibold text-ink"><span>{t('checkout.payOnDelivery')}</span><span>{money(order.cod_amount)}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
