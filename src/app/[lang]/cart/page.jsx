'use client'
import { useEffect, useState } from 'react'
import Link from '@/components/LocalizedLink'
import { cardImage, localized, formatNumber } from '@/lib/format'
import { useLang, useT, useLocalizedRouter } from '@/i18n/client'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { Loader2, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import { MAX_QTY, clampQty } from '@/lib/cart'
import { localDeliveryCharge } from '@/lib/delivery'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'

export default function CartPage() {
  const cart = useCart()
  const router = useLocalizedRouter()
  const t = useT()
  const lang = useLang()
  const money = (v) => formatPrice(v, lang)

  if (!cart || cart.loading) {
    return <div className="container flex items-center gap-2 py-24 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> {t('cart.loading')}</div>
  }

  const { lines, subtotal, weight, count } = cart
  const delivery = localDeliveryCharge(weight)

  if (lines.length === 0) {
    return (
      <div className="container py-16">
        <div className="enter mx-auto max-w-md rounded-3xl border border-line bg-paper p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-clay/10 text-clay"><ShoppingBag className="h-7 w-7" /></span>
          <h1 className="mt-5 font-display text-2xl font-semibold text-ink">{t('cart.emptyTitle')}</h1>
          <p className="mt-2 text-sm text-stone">{t('cart.emptyText')}</p>
          <Link href="/shop" className="btn-primary mt-6">{t('cart.browse')}</Link>
        </div>
      </div>
    )
  }

  function checkout() {
    if (!cart.isLoggedIn) router.push('/login?next=/checkout')
    else router.push('/checkout')
  }

  return (
    <div className="container py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">{t('cart.title')}</h1>
        <button onClick={() => cart.clear()} className="text-sm text-stone hover:text-clay">{t('cart.clear')}</button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Lines */}
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {lines.map((l) => (
              <m.div
                key={l.product_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                // Collapse on remove so the rows below slide up smoothly.
                exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, borderWidth: 0, transition: { duration: 0.2 } }}
                className="flex items-center gap-4 rounded-2xl border border-line bg-paper p-4"
              >
                <Link href={`/product/${l.slug}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-cream">
                  {l.image ? <img src={cardImage(l.image)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" onError={(e) => { if (e.currentTarget.src !== l.image) e.currentTarget.src = l.image }} /> : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${l.slug}`} className="line-clamp-1 font-medium text-ink hover:text-clay">{localized(l, 'name', lang)}</Link>
                  <p className="text-sm text-stone">{money(l.price)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => cart.setQty(l.product_id, l.quantity - 1)} disabled={l.quantity <= 1} className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink hover:border-clay/40 disabled:opacity-40" aria-label={t('cart.decrease')}><Minus className="h-3.5 w-3.5" /></button>
                  <QtyInput value={l.quantity} onCommit={(q) => cart.setQty(l.product_id, q)} label={t('cart.qtyInput', { name: localized(l, 'name', lang) })} />
                  <button onClick={() => cart.setQty(l.product_id, l.quantity + 1)} disabled={l.quantity >= MAX_QTY} className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink hover:border-clay/40" aria-label={t('cart.increase')}><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <div className="w-20 text-right text-sm font-semibold text-ink">{money(l.price * l.quantity)}</div>
                <button onClick={() => cart.remove(l.product_id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone hover:bg-line/60 hover:text-destructive" aria-label={t('cart.remove', { name: localized(l, 'name', lang) })}><Trash2 className="h-4 w-4" /></button>
              </m.div>
            ))}
          </AnimatePresence>
          <p className="pt-1 text-xs text-stone">{t('cart.qtyHint')}</p>
          <datalist id="qty-presets"><option value="20" /><option value="50" /><option value="100" /></datalist>
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-line bg-paper p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold text-ink">{t('cart.summary')}</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-stone"><span>{t('cart.items', { count: formatNumber(count, lang) })}</span><span className="text-ink">{money(subtotal)}</span></div>
            <div className="flex justify-between text-stone"><span>{t('cart.weight')}</span><span className="text-ink">{t('cart.kg', { n: formatNumber(Number(weight.toFixed(2)), lang) })}</span></div>
            <div className="flex justify-between text-stone"><span>{t('cart.delivery')}</span><span className="text-ink">{money(delivery)}</span></div>
            <p className="text-xs text-stone">{t('cart.deliveryNote', { amount: money(localDeliveryCharge(weight, 'Sylhet Sadar, Sylhet')) })}</p>
          </div>
          <div className="mt-4 rounded-xl border border-clay/30 bg-clay/5 p-3 text-xs leading-relaxed text-stone">
            {t('cart.paymentSplit', { subtotal: money(subtotal), delivery: money(delivery) })}
          </div>
          <Button className="mt-5 w-full" size="lg" onClick={checkout}>{t('cart.proceed')} <ArrowRight className="h-4 w-4" /></Button>
          <Link href="/shop" className="mt-3 block text-center text-sm text-stone hover:text-clay">{t('cart.continue')}</Link>
        </div>
      </div>
    </div>
  )
}

// Type any amount (1..1000); quick picks 20 / 50 / 100 appear as suggestions.
// The value is applied on Enter or when the field loses focus.
function QtyInput({ value, onCommit, label }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => { setDraft(String(value)) }, [value])
  const commit = () => {
    const q = clampQty(draft)
    setDraft(String(q))
    if (q !== value) onCommit(q)
  }
  return (
    <input
      type="number" inputMode="numeric" min={1} max={MAX_QTY} step={1} list="qty-presets"
      value={draft} aria-label={label}
      onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
      className="h-8 w-14 rounded-lg border border-line bg-paper text-center text-sm font-medium text-ink [appearance:textfield] focus:border-clay/50 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  )
}
