'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import ProductImage from './ProductImage'
import Image from 'next/image'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { ChevronLeft, ChevronRight, X, Expand } from 'lucide-react'
import { fade, DURATION, EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n/client'

export default function ProductGallery({ images, name }) {
  const t = useT()
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState({})
  const list = images.length ? images : [null]
  const hasImages = Boolean(list[0])
  const many = list.length > 1
  const closeRef = useRef(null)
  const openerRef = useRef(null)

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
    // Lock background scroll while open; move focus into the viewer and give
    // it back to the photo when it closes (keyboard / screen-reader users).
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    openerRef.current = document.activeElement
    requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      openerRef.current?.focus?.()
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
        onKeyDown={(e) => { if (hasImages && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(true) } }}
        role={hasImages ? 'button' : undefined}
        tabIndex={hasImages ? 0 : undefined}
      >
        {/* Name from content (photo alt + this), not an aria-label that hides the visible alt. */}
        {hasImages && <span className="sr-only">{t('gallery.open')}</span>}
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={active}
            {...fade}
            className="absolute inset-0"
          >
            {list[active] && !failed[active] ? (
              <Image src={list[active]} alt={name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority
                onError={() => setFailed((f) => ({ ...f, [active]: true }))} />
            ) : (
              <div className="grid h-full w-full place-items-center text-stone">{t('gallery.noImage')}</div>
            )}
          </m.div>
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
              aria-label={t('gallery.view', { n: i + 1 })}
              className={cn('relative h-20 w-20 overflow-hidden rounded-xl border transition-colors', i === active ? 'border-clay' : 'border-line hover:border-clay/40')}
            >
              {img && <ProductImage src={img} variant="card" alt="" sizes="80px" className="object-cover" />}
            </button>
          ))}
        </div>
      )}

      {/* Full-screen viewer */}
      <AnimatePresence>
        {open && hasImages && (
          <m.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgb(44_42_38/0.95)] p-4 sm:p-8"
            {...fade}
            role="dialog"
            aria-modal="true"
            aria-label={t('gallery.dialog', { name, n: active + 1, total: list.length })}
            onClick={() => setOpen(false)}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('common.close')}
              className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>

            {many && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(-1) }}
                aria-label={t('gallery.prev')}
                className="absolute left-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <m.div
              key={active}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: DURATION.base, ease: EASE.out }}
              className="relative h-full max-h-[85vh] w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={list[active]} alt={name} fill sizes="100vw" className="object-contain" priority />
            </m.div>

            {many && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(1) }}
                aria-label={t('gallery.next')}
                className="absolute right-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {many && (
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                {active + 1} / {list.length}
              </span>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
