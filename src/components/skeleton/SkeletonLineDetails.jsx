'use client'
// Readable breakdown of the skeleton builder line, for the cart and checkout.
import { useState } from 'react'
import Link from '@/components/LocalizedLink'
import { useLang, useT } from '@/i18n/client'
import { formatPrice, formatNumber } from '@/lib/format'
import { ChevronDown, Pencil } from 'lucide-react'

const nm = (o, lang) => (lang === 'bn' && o?.name_bn ? o.name_bn : o?.name_en || '')

export default function SkeletonLineDetails({ line, showEdit = true }) {
  const t = useT()
  const lang = useLang()
  const [open, setOpen] = useState(false)
  const lines = line?.quote?.lines || []
  const setLine = lines.find((l) => l.type === 'set')
  const extras = lines.filter((l) => l.type === 'extra')
  const included = lines.filter((l) => l.type === 'included')
  const side = (s) => (s === 'L' ? t('builder.left') : s === 'R' ? t('builder.right') : '')
  const label = (l) => `${nm(l, lang)}${l.side && l.side !== 'S' ? ` · ${side(l.side)}` : ''}${l.qty > 1 ? ` ×${formatNumber(l.qty, lang)}` : ''}`
  if (!line?.valid) return <p className="mt-1 text-xs text-destructive">{t('builder.invalidSelection')}</p>
  return (
    <div className="mt-1 text-xs text-stone">
      {setLine && <p><span className="font-medium text-ink">{nm(setLine, lang)}</span> — {formatPrice(setLine.amount, lang)}</p>}
      {extras.length > 0 && (
        <ul className="mt-0.5 space-y-0.5">
          {extras.map((l) => <li key={`${l.key}${l.side}`}>{setLine ? '+ ' : ''}{label(l)}{l.amount ? ` — ${formatPrice(l.amount, lang)}` : ''}</li>)}
        </ul>
      )}
      {included.length > 0 && (
        <>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-1 inline-flex items-center gap-1 text-clay hover:underline">
            {t('builder.includedBones')} ({formatNumber(included.reduce((a, l) => a + l.qty, 0), lang)})
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && <ul className="mt-1 grid grid-cols-1 gap-x-3 sm:grid-cols-2">{included.map((l) => <li key={`${l.key}${l.side}`}>{label(l)}</li>)}</ul>}
        </>
      )}
      {showEdit && (
        <Link href="/skeleton-builder" className="mt-1.5 inline-flex items-center gap-1 font-medium text-clay hover:underline"><Pencil className="h-3 w-3" /> {t('builder.edit')}</Link>
      )}
    </div>
  )
}
