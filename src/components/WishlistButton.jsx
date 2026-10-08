'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bookmark } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isWishlisted, toggleWishlist } from '@/lib/social'
import { useWishlist } from './WishlistProvider'
import { cn } from '@/lib/utils'

// variant: "icon" (round overlay button) | "inline" (icon + label)
export default function WishlistButton({ productId, variant = 'icon', className, onChange }) {
  const shared = useWishlist()
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [localSaved, setLocalSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  // Shared wishlist (one query for the whole page). Only falls back to a
  // per-button lookup if rendered outside <WishlistProvider>.
  useEffect(() => {
    if (shared) return
    let a = true
    if (user) isWishlisted(productId).then((v) => a && setLocalSaved(v)).catch(() => {}); else setLocalSaved(false)
    return () => { a = false }
  }, [shared, user, productId])

  const saved = shared ? shared.ids.has(productId) : localSaved

  async function onClick(e) {
    e.preventDefault(); e.stopPropagation()
    if (!user) { router.push(`/login?next=${encodeURIComponent(pathname || '/')}`); return }
    if (busy) return
    setBusy(true)
    try {
      if (shared) { const now = await shared.toggle(productId); onChange?.(now) }
      else { const prev = localSaved; setLocalSaved(!prev); try { const now = await toggleWishlist(productId); setLocalSaved(now); onChange?.(now) } catch { setLocalSaved(prev) } }
    } catch { /* toggle already rolled back */ }
    finally { setBusy(false) }
  }

  if (variant === 'inline') {
    return (
      <button onClick={onClick} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} className={cn('inline-flex items-center justify-center gap-2.5 rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:text-clay active:scale-[0.97]', className)}>
        <Bookmark className={cn('h-4 w-4', saved && 'fill-clay text-clay')} /> {saved ? 'Saved' : 'Save'}
      </button>
    )
  }

  return (
    <button onClick={onClick} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} className={cn('grid h-9 w-9 place-items-center rounded-full border border-line bg-paper/90 text-ink transition-all hover:border-clay/40 hover:text-clay active:scale-90', className)}>
      <motion.span key={saved ? 'on' : 'off'} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
        <Bookmark className={cn('h-4 w-4', saved && 'fill-clay text-clay')} />
      </motion.span>
    </button>
  )
}
