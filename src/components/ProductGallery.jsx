'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Expand } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProductGallery({ images, name }) {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const list = images.length ? images : [null]
  const hasImages = Boolean(list[0])
  const many = list.length > 1

  const go = useCallback(
    (dir) => setActive((i) => (i + dir + list.length) % list.length),
    [list.length],
  )

  // Keyboard controls while the full-screen viewer is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    // Lock background scroll while open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, go])

  return (
    <div>
      <div
        className={cn(
          'group relative aspect-square overflow-hidden rounded-3xl border border-line bg-paper',
          hasImages && 'cursor-zoom-in',
        )}
        onClick={() => hasImages && setOpen(true)}
        role={hasImages ? 'button' : undefined}
        aria-label={hasImages ? 'Open full-screen image' : undefined}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            {list[active] ? (
              <Image src={list[active]} alt={name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
            ) : (
              <div className="grid h-full w-full place-items-center text-stone">No image</div>
            )}
          </motion.div>
        </AnimatePresence>

        {hasImages && (
          <span className="pointer-events-none absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-ink/60 text-paper opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <Expand className="h-4 w-4" />
          </span>
        )}
      </div>

      {many && (
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

      {/* Full-screen viewer */}
      <AnimatePresence>
        {open && hasImages && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/95 p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-paper/10 text-paper transition-colors hover:bg-paper/20"
            >
              <X className="h-5 w-5" />
            </button>

            {many && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(-1) }}
                aria-label="Previous image"
                className="absolute left-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-paper/10 text-paper transition-colors hover:bg-paper/20 sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative h-full max-h-[85vh] w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={list[active]} alt={name} fill sizes="100vw" className="object-contain" priority />
            </motion.div>

            {many && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(1) }}
                aria-label="Next image"
                className="absolute right-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-paper/10 text-paper transition-colors hover:bg-paper/20 sm:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {many && (
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-paper/10 px-3 py-1 text-sm text-paper">
                {active + 1} / {list.length}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
