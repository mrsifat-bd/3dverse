'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useT, useLocalizedRouter } from '@/i18n/client'
import * as m from 'motion/react-m'
import { Heart } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getLikeCount, hasLiked, toggleLike } from '@/lib/social'
import { cn } from '@/lib/utils'

export default function LikeButton({ productId, showCount = true, className }) {
  const { user } = useAuth()
  const router = useLocalizedRouter()
  const t = useT()
  const pathname = usePathname()
  const [count, setCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => { let a = true; getLikeCount(productId).then((c) => a && setCount(c)).catch(() => {}); return () => { a = false } }, [productId])
  useEffect(() => { let a = true; if (user) hasLiked(productId).then((v) => a && setLiked(v)).catch(() => {}); else setLiked(false); return () => { a = false } }, [user, productId])

  async function onClick(e) {
    e.preventDefault(); e.stopPropagation()
    if (!user) { router.push(`/login?next=${encodeURIComponent(pathname || '/')}`); return }
    if (busy) return
    const prev = liked
    setBusy(true); setLiked(!prev); setCount((c) => c + (prev ? -1 : 1))
    try { setLiked(await toggleLike(productId)) }
    catch { setLiked(prev); setCount((c) => c + (prev ? 1 : -1)) }
    finally { setBusy(false) }
  }

  return (
    <button onClick={onClick} aria-pressed={liked} className={cn('inline-flex items-center gap-1.5 text-sm', className)}>
      {/* Name from content ("Like 3"), so the visible count is part of it. */}
      <span className="sr-only">{liked ? t('product.unlike') : t('product.like')}</span>
      <m.span key={liked ? 'on' : 'off'} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
        <Heart className={cn('h-5 w-5 transition-colors', liked ? 'fill-clay text-clay' : 'text-stone')} />
      </m.span>
      {showCount && <span className="text-stone">{count}</span>}
    </button>
  )
}
