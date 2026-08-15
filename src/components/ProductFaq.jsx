'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Collapsible FAQ accordion — only questions show; click to expand the answer.
export default function ProductFaq({ faqs }) {
  const [open, setOpen] = useState(-1)
  if (!Array.isArray(faqs) || faqs.length === 0) return null

  return (
    <section className="mt-16 max-w-3xl">
      <h2 className="font-display text-2xl font-semibold text-ink">Frequently asked questions</h2>
      <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {faqs.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={i} className="bg-paper">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-line/30"
              >
                <span className="text-sm font-medium text-ink">{f.q}</span>
                <ChevronDown className={cn('h-5 w-5 shrink-0 text-clay transition-transform duration-300', isOpen && 'rotate-180')} />
              </button>
              <div className={cn('grid transition-all duration-300 ease-out', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                <div className="overflow-hidden">
                  <p className="whitespace-pre-line px-5 pb-5 text-sm leading-relaxed text-stone">{f.a}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
