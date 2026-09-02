'use client'
import { useState } from 'react'
import Image from 'next/image'

// Product image with a graceful fallback. If the src is missing or the image
// fails to load (e.g. a briefly-unavailable URL), it shows a clean "No image"
// placeholder instead of a broken-image icon. Fills its positioned parent.
export default function ProductImage({ src, alt = '', className = '', sizes, priority = false }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <div className="grid h-full w-full place-items-center bg-line/40 text-xs text-stone">No image</div>
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
