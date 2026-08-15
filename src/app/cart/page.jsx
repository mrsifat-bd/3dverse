'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import { localDeliveryCharge } from '@/lib/delivery'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'

export default function CartPage() {
  const cart = useCart()
  const router = useRouter()

  if (!cart || cart.loading) {
    return <div className="container flex items-center gap-2 py-24 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading cart…</div>
  }

  const { lines, subtotal, weight, count } = cart
  const delivery = localDeliveryCharge(weight)

  if (lines.length === 0) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-line bg-paper p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-clay/10 text-clay"><ShoppingBag className="h-7 w-7" /></span>
          <h1 className="mt-5 font-display text-2xl font-semibold text-ink">Your cart is empty</h1>
          <p className="mt-2 text-sm text-stone">Browse our products and add something you like.</p>
          <Link href="/shop" className="btn-primary mt-6">Browse products</Link>
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
        <h1 className="font-display text-3xl font-semibold text-ink">Your cart</h1>
        <button onClick={() => cart.clear()} className="text-sm text-stone hover:text-clay">Clear cart</button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Lines */}
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {lines.map((l) => (
              <motion.div
                key={l.product_id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-4 rounded-2xl border border-line bg-paper p-4"
              >
                <Link href={`/product/${l.slug}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-cream">
                  {l.image ? <img src={l.image} alt="" className="h-full w-full object-cover" /> : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${l.slug}`} className="line-clamp-1 font-medium text-ink hover:text-clay">{l.name}</Link>
                  <p className="text-sm text-stone">{formatPrice(l.price)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => cart.setQty(l.product_id, l.quantity - 1)} disabled={l.quantity <= 1} className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink hover:border-clay/40 disabled:opacity-40" aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-7 text-center text-sm font-medium text-ink">{l.quantity}</span>
                  <button onClick={() => cart.setQty(l.product_id, l.quantity + 1)} className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink hover:border-clay/40" aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <div className="w-20 text-right text-sm font-semibold text-ink">{formatPrice(l.price * l.quantity)}</div>
                <button onClick={() => cart.remove(l.product_id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone hover:bg-line/60 hover:text-destructive" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-line bg-paper p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold text-ink">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-stone"><span>Items ({count})</span><span className="text-ink">{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-stone"><span>Total weight</span><span className="text-ink">{weight.toFixed(2)} kg</span></div>
            <div className="flex justify-between text-stone"><span>Delivery charge</span><span className="text-ink">{formatPrice(delivery)}</span></div>
          </div>
          <div className="mt-4 rounded-xl border border-clay/30 bg-clay/5 p-3 text-xs leading-relaxed text-stone">
            <span className="font-medium text-ink">Product total ({formatPrice(subtotal)})</span> is paid <span className="font-medium text-ink">Cash on Delivery</span>. The <span className="font-medium text-ink">delivery charge ({formatPrice(delivery)})</span> is prepaid via bKash at checkout.
          </div>
          <Button className="mt-5 w-full" size="lg" onClick={checkout}>Proceed to checkout <ArrowRight className="h-4 w-4" /></Button>
          <Link href="/shop" className="mt-3 block text-center text-sm text-stone hover:text-clay">Continue shopping</Link>
        </div>
      </div>
    </div>
  )
}
