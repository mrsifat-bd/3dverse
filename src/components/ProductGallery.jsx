'use client'
import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export default function ProductGallery({ images, name }) {
  const [active, setActive] = useState(0)
  const list = images.length ? images : [null]

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-line bg-paper">
        {list[active] ? (
          <Image src={list[active]} alt={name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
        ) : (
          <div className="grid h-full w-full place-items-center text-stone">No image</div>
        )}
      </div>
      {list.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {list.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn('relative h-20 w-20 overflow-hidden rounded-xl border transition-colors', i === active ? 'border-clay' : 'border-line hover:border-clay/40')}
            >
              {img && <Image src={img} alt="" fill sizes="80px" className="object-cover" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
