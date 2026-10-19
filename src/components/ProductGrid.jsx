'use client'
import { useState } from 'react'
import Reveal from './Reveal'
import ProductCard from './ProductCard'
import { Skeleton } from './ui/skeleton'
import { useT } from '@/i18n/client'

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-line bg-paper">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

// `animateKey` changes (shop filter/sort) re-trigger a quick fade so results
// don't snap — but never on first render, so server HTML paints immediately.
// Cards below the fold reveal as they scroll in (once per visit), and their
// rendering is skipped until they get near the screen (content-visibility).
export default function ProductGrid({ products, animateKey }) {
  const t = useT()
  const [initialKey] = useState(animateKey)
  if (!products.length) {
    return (
      <div className="enter rounded-2xl border border-dashed border-line bg-paper py-16 text-center">
        <p className="text-sm text-stone">{t('shop.noResults')}</p>
      </div>
    )
  }
  return (
    <div key={animateKey} className={`${animateKey !== initialKey ? 'fade-up ' : ''}grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4`}>
      {products.map((p, i) => (
        <Reveal key={p.id} revealKey={p.id} delayIndex={i} className={i >= 8 ? 'cv-auto' : undefined}>
          <ProductCard product={p} priority={i < 2} />
        </Reveal>
      ))}
    </div>
  )
}
