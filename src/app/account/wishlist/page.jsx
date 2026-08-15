'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Heart } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getWishlist } from '@/lib/social'
import ProductGrid from '@/components/ProductGrid'

export default function WishlistPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState(null)

  useEffect(() => { if (!loading && !user) router.replace('/login?next=/account/wishlist') }, [loading, user, router])
  useEffect(() => { if (!user) return; getWishlist().then(setItems).catch(() => setItems([])) }, [user])

  if (loading || !user || items === null) {
    return <div className="container flex items-center gap-2 py-24 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
  }

  return (
    <div className="container py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">My Wishlist</h1>
      <p className="mt-1 text-sm text-stone">Products you saved. Tap the bookmark on a card to remove it.</p>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-paper py-16 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-clay/10 text-clay"><Heart className="h-6 w-6" /></span>
          <p className="mt-4 text-sm text-stone">No saved products yet.</p>
          <Link href="/shop" className="btn-primary mt-5">Browse products</Link>
        </div>
      ) : (
        <div className="mt-8"><ProductGrid products={items} /></div>
      )}
      <p className="mt-8 text-sm"><Link href="/account" className="text-clay hover:underline">← Back to account</Link></p>
    </div>
  )
}
