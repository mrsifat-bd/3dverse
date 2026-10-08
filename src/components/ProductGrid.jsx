'use client'
import Reveal from './Reveal'
import ProductCard from './ProductCard'
import { Skeleton } from './ui/skeleton'

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

// `animateKey` re-triggers a quick fade when it changes (e.g. shop filter/sort)
// so filtered results don't snap. Cards further down reveal as they scroll in.
export default function ProductGrid({ products, animateKey }) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-paper py-16 text-center">
        <p className="text-sm text-stone">No products found. Try a different search or category.</p>
      </div>
    )
  }
  return (
    <div key={animateKey} className="fade-up grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <Reveal key={p.id} delayIndex={i}>
          <ProductCard product={p} />
        </Reveal>
      ))}
    </div>
  )
}
