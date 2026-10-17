'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Check, Truck } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/format'
import { trackingUrlFor } from '@/lib/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Customer-facing progress, in the order an order moves through.
const STEPS = [
  { key: 'placed', label: 'Order placed' },
  { key: 'confirmed', label: 'Payment verified & confirmed' },
  { key: 'printing', label: 'Printed & packed' },
  { key: 'shipped', label: 'With the courier' },
  { key: 'delivered', label: 'Delivered' },
]
const STEP_OF = { new: 0, confirmed: 1, ready: 2, sent_to_steadfast: 3, shipped: 3, delivered: 4 }
const ENDED = { cancelled: 'Cancelled', returned: 'Returned', failed: 'Delivery failed' }

export default function TrackOrder() {
  const params = useSearchParams()
  const [number, setNumber] = useState(params.get('n') || '')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(''); setOrder(null)
    const p = phone.replace(/\D/g, '').slice(-11)
    if (!number.trim()) { setError('Enter your order number.'); return }
    if (!/^01\d{9}$/.test(p)) { setError('Enter the 11-digit phone number you ordered with.'); return }
    if (!isSupabaseConfigured) { setError('Tracking is not available right now.'); return }
    setBusy(true)
    const { data, error: err } = await supabase.rpc('track_order', { p_order_number: number.trim(), p_phone: p })
    setBusy(false)
    if (err) { setError('Could not check the order right now. Please try again.'); return }
    if (!data) { setError('No order found with that order number and phone number. Please check both and try again.'); return }
    setOrder(data)
  }

  const ended = order && ENDED[order.status]
  const current = order ? (STEP_OF[order.status] ?? 0) : 0
  const paymentRejected = order?.payment_status === 'rejected'

  return (
    <div className="mt-8">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-paper p-6">
        <div className="space-y-1.5">
          <Label htmlFor="ordno">Order number</Label>
          <Input id="ordno" value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} placeholder="e.g. 3D-20261017-001" autoComplete="off" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ordphone">Phone number</Label>
          <Input id="ordphone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" autoComplete="tel" />
        </div>
        {error && <p role="alert" className="enter text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</> : 'Track order'}</Button>
      </form>

      {order && (
        <div className="enter mt-8 rounded-2xl border border-line bg-paper p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-semibold text-ink">Order {order.order_number}</h2>
            <span className="text-xs text-stone">Placed {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>

          {ended ? (
            <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-ink">This order is <span className="font-semibold">{ended.toLowerCase()}</span>. Contact us if you have questions.</p>
          ) : (
            <ol className="mt-6 space-y-4">
              {STEPS.map((s, i) => {
                const done = i < current || (i === current && order.status === 'delivered')
                const active = i === current && order.status !== 'delivered'
                return (
                  <li key={s.key} className="flex items-center gap-3">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${done ? 'bg-clay text-paper' : active ? 'border-2 border-clay text-clay' : 'border border-line text-stone'}`}>
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className={`text-sm ${done || active ? 'font-medium text-ink' : 'text-stone'}`}>{s.label}</span>
                  </li>
                )
              })}
            </ol>
          )}

          {paymentRejected && !ended && (
            <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-ink">We could not verify your bKash delivery payment. Please contact us so we can sort it out.</p>
          )}
          {order.payment_status === 'pending' && !ended && (
            <p className="mt-4 text-xs text-stone">Your bKash delivery payment is waiting to be checked by our team.</p>
          )}

          {order.tracking_code && (
            <a href={trackingUrlFor(order.tracking_code)} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-5 w-full">
              <Truck className="h-4 w-4" /> Courier tracking: {order.tracking_code}
            </a>
          )}

          <ul className="mt-6 divide-y divide-line border-t border-line text-sm">
            {(order.items || []).map((it, i) => (
              <li key={i} className="flex justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate text-ink">{it.name} <span className="text-stone">× {it.qty}</span></span>
                <span className="shrink-0 text-ink">{formatPrice(Number(it.unit_price) * Number(it.qty))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-stone"><span>Delivery charge (bKash)</span><span className="text-ink">{formatPrice(order.delivery_charge)}</span></div>
            <div className="flex justify-between font-semibold text-ink"><span>Pay on delivery</span><span>{formatPrice(order.cod_amount)}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
