'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, ArrowLeft, Check, PackagePlus } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getAllProducts } from '@/lib/products'
import { effectivePrice, formatPrice } from '@/lib/format'
import { adminCreateOrder, computeTotals, isValidBDPhone } from '@/lib/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

let keySeq = 0
const newKey = () => `line-${++keySeq}`

export default function NewOrderForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_address: '', note: '',
    delivery_charge: 0, discount: 0, weight_kg: 0.5, status: 'new',
  })
  const [lines, setLines] = useState([])
  const [products, setProducts] = useState([])
  const [pick, setPick] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null) // { order_number }

  useEffect(() => { getAllProducts().then(setProducts).catch(() => setProducts([])) }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setLine = (key, patch) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const removeLine = (key) => setLines((ls) => ls.filter((l) => l.key !== key))

  function addProduct(id) {
    const p = products.find((x) => String(x.id) === String(id))
    if (!p) return
    setLines((ls) => [...ls, { key: newKey(), product_id: p.id, name: p.name, slug: p.slug, unit_price: effectivePrice(p), qty: 1, custom: false }])
    setPick('')
  }
  function addCustom() {
    setLines((ls) => [...ls, { key: newKey(), product_id: null, name: '', slug: '', unit_price: '', qty: 1, custom: true }])
  }

  const totals = useMemo(
    () => computeTotals({
      items: lines.map((l) => ({ unit_price: l.unit_price, qty: l.qty })),
      delivery_charge: form.delivery_charge, discount: form.discount,
    }),
    [lines, form.delivery_charge, form.discount]
  )

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.customer_name.trim() || form.customer_name.trim().length < 2) return setError('Enter the customer name.')
    if (!isValidBDPhone(form.customer_phone)) return setError('Enter a valid 11-digit phone (e.g. 01712345678).')
    if (form.customer_address.trim().length < 10) return setError('Enter a full delivery address.')
    if (lines.length === 0) return setError('Add at least one item.')
    if (lines.some((l) => !l.name.trim())) return setError('Every custom item needs a name.')

    setSaving(true)
    let actor = ''
    try { const { data } = await supabase.auth.getSession(); actor = data?.session?.user?.email || '' } catch {}
    const res = await adminCreateOrder({
      customer_name: form.customer_name, customer_phone: form.customer_phone, customer_address: form.customer_address,
      note: form.note, delivery_charge: form.delivery_charge, discount: form.discount, weight_kg: form.weight_kg,
      status: form.status, actor,
      items: lines.map((l) => ({ product_id: l.product_id, name: l.name, slug: l.slug, unit_price: l.unit_price, qty: l.qty })),
    })
    setSaving(false)
    if (!res.ok) { setError(res.error || 'Could not create the order.'); return }
    setDone({ order_number: res.order_number, warning: res.warning })
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-paper p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-clay/10 text-clay"><Check className="h-6 w-6" /></div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Order created</h1>
        <p className="mt-1 text-sm text-stone">Order ID</p>
        <p className="font-display text-xl font-bold text-ink">{done.order_number}</p>
        {done.warning && <p className="mt-3 text-sm text-destructive">{done.warning}</p>}
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild><Link href="/admin/orders">Go to orders</Link></Button>
          <Button variant="ghost" onClick={() => { setDone(null); setLines([]); setForm({ customer_name: '', customer_phone: '', customer_address: '', note: '', delivery_charge: 0, discount: 0, weight_kg: 0.5, status: 'new' }) }}>Add another</Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link href="/admin/orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">New order</h1>
          <p className="mt-1 text-sm text-stone">Add an order that came in by phone, WhatsApp, or in person.</p>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</p>}

      {/* Customer */}
      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Customer</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cname">Full name</Label>
            <Input id="cname" value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cphone">Phone (11 digits)</Label>
            <Input id="cphone" inputMode="numeric" placeholder="01712345678" value={form.customer_phone} onChange={(e) => set('customer_phone', e.target.value.replace(/[^0-9]/g, ''))} required />
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="caddr">Delivery address</Label>
          <Textarea id="caddr" rows={2} placeholder="House/road, area, thana, district" value={form.customer_address} onChange={(e) => set('customer_address', e.target.value)} required />
        </div>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="cnote">Note (optional)</Label>
          <Input id="cnote" value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Colour, size, source (e.g. Facebook), etc." />
        </div>
      </section>

      {/* Items */}
      <section className="mt-5 rounded-2xl border border-line bg-paper p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Items</h2>
          <div className="flex items-center gap-2">
            <Select value={pick} onChange={(e) => addProduct(e.target.value)} aria-label="Add product" className="h-9">
              <option value="">+ Add product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatPrice(effectivePrice(p))}</option>)}
            </Select>
            <Button type="button" variant="ghost" size="sm" onClick={addCustom}><Plus className="h-4 w-4" /> Custom item</Button>
          </div>
        </div>

        {lines.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line bg-cream/40 py-8 text-center text-sm text-stone">No items yet. Pick a product or add a custom item.</p>
        ) : (
          <div className="mt-4 space-y-2">
            <div className="hidden grid-cols-[1fr_80px_110px_110px_36px] gap-2 px-1 text-[11px] uppercase tracking-wider text-stone sm:grid">
              <span>Product</span><span className="text-center">Qty</span><span className="text-right">Unit price</span><span className="text-right">Total</span><span />
            </div>
            {lines.map((l) => (
              <div key={l.key} className="grid grid-cols-2 items-center gap-2 rounded-xl border border-line p-2 sm:grid-cols-[1fr_80px_110px_110px_36px]">
                {l.custom ? (
                  <Input className="col-span-2 h-9 sm:col-span-1" placeholder="Item name" value={l.name} onChange={(e) => setLine(l.key, { name: e.target.value })} />
                ) : (
                  <span className="col-span-2 truncate px-1 text-sm font-medium text-ink sm:col-span-1">{l.name}</span>
                )}
                <Input className="h-9 text-center" inputMode="numeric" value={l.qty} onChange={(e) => setLine(l.key, { qty: e.target.value.replace(/[^0-9]/g, '') })} aria-label="Quantity" />
                <Input className="h-9 text-right" inputMode="numeric" value={l.unit_price} onChange={(e) => setLine(l.key, { unit_price: e.target.value.replace(/[^0-9.]/g, '') })} aria-label="Unit price" />
                <span className="px-1 text-right text-sm font-medium text-ink">{formatPrice((Number(l.unit_price) || 0) * (Number(l.qty) || 0))}</span>
                <button type="button" onClick={() => removeLine(l.key)} aria-label="Remove item" className="grid h-9 w-9 place-items-center rounded-lg text-stone hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Charges + status + totals */}
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Charges</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>Delivery ৳</Label><Input inputMode="numeric" value={form.delivery_charge} onChange={(e) => set('delivery_charge', e.target.value.replace(/[^0-9.]/g, ''))} /></div>
            <div className="space-y-1.5"><Label>Discount ৳</Label><Input inputMode="numeric" value={form.discount} onChange={(e) => set('discount', e.target.value.replace(/[^0-9.]/g, ''))} /></div>
            <div className="space-y-1.5"><Label>Weight kg</Label><Input inputMode="decimal" value={form.weight_kg} onChange={(e) => set('weight_kg', e.target.value.replace(/[^0-9.]/g, ''))} /></div>
          </div>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="status">Create as</Label>
            <Select id="status" value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full">
              <option value="new">New (review later)</option>
              <option value="confirmed">Confirmed (generate invoice now)</option>
            </Select>
            <p className="text-xs text-stone">Confirming immediately generates the invoice.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-cream/50 p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-stone"><span>Subtotal</span><span className="text-ink">{formatPrice(totals.subtotal)}</span></div>
            <div className="flex justify-between text-stone"><span>Delivery</span><span className="text-ink">{formatPrice(Number(form.delivery_charge) || 0)}</span></div>
            <div className="flex justify-between text-stone"><span>Discount</span><span className="text-ink">- {formatPrice(Number(form.discount) || 0)}</span></div>
            <div className="mt-1 flex items-center justify-between border-t border-line pt-2">
              <span className="font-semibold text-ink">Total (COD)</span>
              <span className="font-display text-lg font-bold text-ink">{formatPrice(totals.cod_amount)}</span>
            </div>
          </div>
          <Button type="submit" className="mt-5 w-full" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <><PackagePlus className="h-4 w-4" /> Create order</>}
          </Button>
        </div>
      </section>
    </form>
  )
}
