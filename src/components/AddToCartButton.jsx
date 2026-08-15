'use client'
import { useState } from 'react'
import { ShoppingBag, Check, Loader2 } from 'lucide-react'
import { useCart } from './CartProvider'
import { cn } from '@/lib/utils'

// Adds a product to the cart with brief "Added" feedback.
export default function AddToCartButton({ product, qty = 1, full = false, variant = 'primary', className }) {
  const cart = useCart()
  const [added, setAdded] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onClick() {
    if (!cart || busy) return
    setBusy(true)
    try {
      await cart.add(product, qty)
      setAdded(true)
      setTimeout(() => setAdded(false), 1600)
    } finally {
      setBusy(false)
    }
  }

  const base =
    variant === 'ghost'
      ? 'border border-line text-ink hover:border-clay/40 hover:text-clay'
      : 'bg-clay text-paper hover:bg-clay-dark'

  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-label="Add to cart"
      className={cn(
        'inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-70',
        base,
        full && 'w-full',
        className
      )}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
      {added ? 'Added' : 'Add to cart'}
    </button>
  )
}
