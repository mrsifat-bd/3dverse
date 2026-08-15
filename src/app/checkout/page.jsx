'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Copy, Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/components/CartProvider'
import { getMyProfile } from '@/lib/profile'
import { placeOrder, isValidBDPhone } from '@/lib/orders'
import { localDeliveryCharge } from '@/lib/delivery'
import { formatPrice } from '@/lib/format'
import { BKASH } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const STEPS = ['Summary', 'Delivery payment', 'Your details']

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth()
  const cart = useCart()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_address: '', note: '', transaction_id: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?next=/checkout')
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    getMyProfile().then(({ profile }) => {
      setForm((f) => ({
        ...f,
        customer_name: f.customer_name || profile?.full_name || '',
        customer_phone: f.customer_phone || profile?.phone || '',
        customer_address: f.customer_address || profile?.default_address || '',
      }))
    })
  }, [user])

  const lines = cart?.lines || []
  const subtotal = cart?.subtotal || 0
  const weight = cart?.weight || 0
  const delivery = useMemo(() => localDeliveryCharge(weight), [weight])

  if (authLoading || !user || !cart || cart.loading) {
    return <div className="container flex items-center gap-2 py-24 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
  }

  if (lines.length === 0) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-line bg-paper p-10 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Your cart is empty</h1>
          <p className="mt-2 text-sm text-stone">Add a product before checking out.</p>
          <Link href="/shop" className="btn-primary mt-6">Browse products</Link>
        </div>
      </div>
    )
  }

  function copyNumber() {
    try { navigator.clipboard.writeText(BKASH.number) } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function confirm() {
    setError('')
    if (!isValidBDPhone(form.customer_phone)) { setError('Enter a valid 11-digit phone number.'); return }
    if (form.customer_name.trim().length < 2 || form.customer_address.trim().length < 10) { setError('Enter your full name and delivery address.'); return }
    setBusy(true)
    const r = await placeOrder({
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_address: form.customer_address,
      note: form.note,
      transaction_id: form.transaction_id,
      items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
    })
    setBusy(false)
    if (!r.ok) { setError(r.error || 'Could not place the order.'); return }
    try { await cart.clear() } catch {}
    const q = new URLSearchParams({ n: r.order_number, cod: String(r.cod), delivery: String(r.delivery), txn: form.transaction_id.trim() })
    router.push(`/checkout/success?${q.toString()}`)
  }

  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Checkout</h1>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1
          const active = step === n
          const done = step > n
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${active ? 'bg-clay text-paper' : done ? 'bg-clay/20 text-clay' : 'border border-line text-stone'}`}>{done ? <Check className="h-4 w-4" /> : n}</span>
              <span className={`hidden text-sm sm:block ${active ? 'font-medium text-ink' : 'text-stone'}`}>{label}</span>
              {n < STEPS.length && <span className="h-px flex-1 bg-line" />}
            </div>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="mt-8">

          {step === 1 && (
            <div className="rounded-2xl border border-line bg-paper p-6">
              <h2 className="font-display text-lg font-semibold text-ink">Order summary</h2>
              <ul className="mt-4 divide-y divide-line">
                {lines.map((l) => (
                  <li key={l.product_id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="min-w-0 truncate text-ink">{l.name} <span className="text-stone">× {l.quantity}</span></span>
                    <span className="shrink-0 font-medium text-ink">{formatPrice(l.price * l.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between text-stone"><span>Product subtotal (COD)</span><span className="text-ink">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-stone"><span>Delivery charge (prepaid via bKash)</span><span className="text-ink">{formatPrice(delivery)}</span></div>
                <div className="flex justify-between font-semibold text-ink"><span>Pay on delivery (COD)</span><span>{formatPrice(subtotal)}</span></div>
              </div>
              <Button className="mt-6 w-full" size="lg" onClick={() => setStep(2)}>Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-2xl border border-line bg-paper p-6">
              <h2 className="font-display text-lg font-semibold text-ink">Pay delivery charge via bKash</h2>
              <p className="mt-1 text-sm text-stone">Your delivery charge is <span className="font-semibold text-ink">{formatPrice(delivery)}</span>. Send this via bKash to confirm your order. The product price ({formatPrice(subtotal)}) is paid on delivery.</p>

              <div className="mt-5 rounded-xl border border-clay/30 bg-clay/5 p-4">
                <div className="flex items-center justify-between"><span className="text-sm text-stone">bKash number</span><button onClick={copyNumber} className="inline-flex items-center gap-1.5 text-sm font-medium text-clay">{copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}</button></div>
                <p className="mt-1 font-display text-2xl font-semibold text-ink">{BKASH.number}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-stone">Type</p><p className="font-medium text-ink">{BKASH.type}</p></div>
                  <div><p className="text-stone">Amount</p><p className="font-medium text-ink">{formatPrice(delivery)}</p></div>
                </div>
              </div>

              <div className="mt-5 space-y-1.5">
                <Label htmlFor="txn">bKash transaction ID <span className="text-clay">*</span></Label>
                <Input id="txn" value={form.transaction_id} onChange={(e) => set('transaction_id', e.target.value.toUpperCase())} placeholder="e.g. 9F2K7XQ1AB" />
                <p className="text-xs text-stone">Open bKash → Send Money → send ৳{delivery} to {BKASH.number}, then paste the Transaction ID here.</p>
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)} disabled={!form.transaction_id.trim()}>Continue to delivery info <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-2xl border border-line bg-paper p-6">
              <h2 className="font-display text-lg font-semibold text-ink">Delivery information</h2>
              <div className="mt-5 space-y-4">
                <div className="space-y-1.5"><Label htmlFor="name">Full name</Label><Input id="name" value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} autoComplete="name" /></div>
                <div className="space-y-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" inputMode="tel" value={form.customer_phone} onChange={(e) => set('customer_phone', e.target.value)} placeholder="01XXXXXXXXX" autoComplete="tel" /></div>
                <div className="space-y-1.5"><Label htmlFor="addr">Delivery address</Label><Textarea id="addr" rows={3} value={form.customer_address} onChange={(e) => set('customer_address', e.target.value)} placeholder="House / road, area, thana, district" autoComplete="street-address" /></div>
                <div className="space-y-1.5"><Label htmlFor="note">Notes <span className="text-stone">(optional)</span></Label><Textarea id="note" rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} /></div>
              </div>

              <div className="mt-5 rounded-xl border border-clay/30 bg-clay/5 p-3 text-xs leading-relaxed text-stone">
                Delivery charge <span className="font-medium text-ink">{formatPrice(delivery)}</span> paid via bKash (txn {form.transaction_id || '—'}). Product total <span className="font-medium text-ink">{formatPrice(subtotal)}</span> collected as <span className="font-medium text-ink">Cash on Delivery</span>.
              </div>

              {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

              <div className="mt-6 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(2)} disabled={busy}><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button className="flex-1" onClick={confirm} disabled={busy}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</> : 'Confirm order'}</Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
