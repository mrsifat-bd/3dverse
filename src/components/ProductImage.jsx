'use client'
import { useState } from 'react'
import Image from 'next/image'
import { cardImage } from '@/lib/format'

// Product image with a graceful fallback. Fills its positioned parent (the
// parent reserves the space via aspect-ratio, so there is no layout shift).
//
// variant="card" loads the 640px WebP made at upload time instead of the
// full-size image — product grids and thumbnails no longer download 2000px
// photos. If that variant is missing (older uploads) it falls back to the full
// image, and only then to a clean "No image" placeholder.
export default function ProductImage({ src, alt = '', className = '', sizes, priority = false, variant = 'full' }) {
  const small = variant === 'card' ? cardImage(src) : src
  const [stage, setStage] = useState(0) // 0 = preferred, 1 = full-size fallback, 2 = failed
  const current = stage === 0 ? small : src

  if (!src || stage === 2) {
    return <div className="grid h-full w-full place-items-center bg-line/40 text-xs text-stone">No image</div>
  }
  return (
    <Image
      key={current}
      src={current}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setStage((s) => (s === 0 && small !== src ? 1 : 2))}
    />
  )
}
