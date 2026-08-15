'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useCart } from './CartProvider'
import { cn } from '@/lib/utils'

// Adds the product to the cart, then sends the user to checkout (login first if needed).
export default function BuyNowButton({ product, qty = 1, full = false, className }) {
  const cart = useCart()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function onClick() {
    if (!cart || busy) return
    setBusy(true)
    try {
      await cart.add(product, qty)
      router.push(cart.isLoggedIn ? '/checkout' : '/login?next=/checkout')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={cn(
        'inline-flex items-center justify-center gap-2.5 rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:text-clay active:scale-[0.97] disabled:opacity-70',
        full && 'w-full',
        className
      )}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Buy now
    </button>
  )
}
