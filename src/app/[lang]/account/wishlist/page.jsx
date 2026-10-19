'use client'
import { useEffect, useState } from 'react'
import Link from '@/components/LocalizedLink'
import { useT, useLocalizedRouter } from '@/i18n/client'
import { Loader2, Heart } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getWishlist } from '@/lib/social'
import ProductGrid from '@/components/ProductGrid'

export default function WishlistPage() {
  const { user, loading } = useAuth()
  const router = useLocalizedRouter()
  const t = useT()
  const [items, setItems] = useState(null)

  useEffect(() => { if (!loading && !user) router.replace('/login?next=/account/wishlist') }, [loading, user, router])
  useEffect(() => { if (!user) return; getWishlist().then(setItems).catch(() => setItems([])) }, [user])

  if (loading || !user || items === null) {
    return <div className="container flex items-center gap-2 py-24 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> {t('common.loading')}</div>
  }

  return (
    <div className="container py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">{t('account.wishlistTitle')}</h1>
      <p className="mt-1 text-sm text-stone">{t('account.wishlistText')}</p>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-paper py-16 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-clay/10 text-clay"><Heart className="h-6 w-6" /></span>
          <p className="mt-4 text-sm text-stone">{t('account.wishlistEmpty')}</p>
          <Link href="/shop" className="btn-primary mt-5">{t('cart.browse')}</Link>
        </div>
      ) : (
        <div className="mt-8"><ProductGrid products={items} /></div>
      )}
      <p className="mt-8 text-sm"><Link href="/account" className="text-clay hover:underline">← {t('account.backToAccount')}</Link></p>
    </div>
  )
}
