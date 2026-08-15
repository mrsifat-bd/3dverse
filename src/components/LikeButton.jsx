'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getLikeCount, hasLiked, toggleLike } from '@/lib/social'
import { cn } from '@/lib/utils'

export default function LikeButton({ productId, showCount = true, className }) {
  const { user } = useAuth()
  const router = useRouter()
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
    <button onClick={onClick} aria-label={liked ? 'Unlike' : 'Like'} className={cn('inline-flex items-center gap-1.5 text-sm', className)}>
      <motion.span key={liked ? 'on' : 'off'} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
        <Heart className={cn('h-5 w-5 transition-colors', liked ? 'fill-clay text-clay' : 'text-stone')} />
      </motion.span>
      {showCount && <span className="text-stone">{count}</span>}
    </button>
  )
}
