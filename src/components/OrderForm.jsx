'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createOrder, computeTotals, validateOrderInput } from '@/lib/orders'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Customer delivery-order form. Saves an order (status "new"); it does NOT
// book a courier — the admin reviews and creates the Steadfast parcel later.
export default function OrderForm({ product }) {
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_address: '', note: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const items = useMemo(
    () => [{ product_id: product.id, name: product.name, slug: product.slug, unit_price: product.unit_price, qty: Math.max(1, Number(qty) || 1) }],
    [product, qty]
  )
  const { subtotal } = useMemo(() => computeTotals({ items }), [items])

  async function submit(e) {
    e.preventDefault()
    setServerError('')
    const check = validateOrderInput({ ...form, items })
    setErrors(check.errors)
    if (!check.ok) return
    setBusy(true)
    const r = await createOrder({ ...form, items })
    setBusy(false)
    if (r.ok) {
      router.push(`/order/success?n=${encodeURIComponent(r.order_number)}`)
    } else {
      setErrors(r.errors || {})
      setServerError(r.error || 'Something went wrong. Please try again.')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Product summary */}
      <div className="rounded-2xl border border-line bg-paper p-5">
        <p className="text-xs uppercase tracking-wide text-stone">Your order</p>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{product.name}</p>
            <p className="text-sm text-stone">{formatPrice(product.unit_price)} each</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setQty((q) => Math.max(1, Number(q) - 1))} className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink hover:border-clay/40" aria-label="Decrease quantity">−</button>
            <input value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, '') || 1)} inputMode="numeric" aria-label="Quantity" className="h-9 w-12 rounded-lg border border-line bg-cream text-center text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
            <button type="button" onClick={() => setQty((q) => Math.max(1, Number(q) + 1))} className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink hover:border-clay/40" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
          <span className="text-stone">Subtotal</span>
          <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-2 text-xs text-stone">Delivery charge is confirmed by our team before dispatch. You pay on delivery (Cash on Delivery).</p>
      </div>

      {/* Customer info */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} placeholder="e.g. Rahim Ahmed" autoComplete="name" />
          {errors.customer_name && <p className="text-xs text-destructive">{errors.customer_name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" value={form.customer_phone} onChange={(e) => set('customer_phone', e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" autoComplete="tel" />
          {errors.customer_phone && <p className="text-xs text-destructive">{errors.customer_phone}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Delivery address</Label>
          <Textarea id="address" rows={3} value={form.customer_address} onChange={(e) => set('customer_address', e.target.value)} placeholder="House / road, area, thana, district" autoComplete="street-address" />
          {errors.customer_address && <p className="text-xs text-destructive">{errors.customer_address}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="note">Notes <span className="text-stone">(optional)</span></Label>
          <Textarea id="note" rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Any delivery instructions" />
        </div>
      </div>

      {serverError && <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{serverError}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</> : 'Place order'}
      </Button>
      <p className="text-center text-xs text-stone">No online payment. We&apos;ll confirm your order and delivery by phone/WhatsApp.</p>
    </form>
  )
}
