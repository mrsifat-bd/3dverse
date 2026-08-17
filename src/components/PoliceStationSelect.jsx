'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, MapPin, Check } from 'lucide-react'
import { POLICE_STATIONS } from '@/lib/policeStations'
import { cn } from '@/lib/utils'

// Searchable dropdown of all Bangladeshi police stations (thanas), grouped by
// district in the label. Stores the full "Thana, District" string as the value.
export default function PoliceStationSelect({ value, onChange, id = 'police_station', invalid = false, placeholder = 'Select your police station (thana)' }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    const list = s ? POLICE_STATIONS.filter((p) => p.label.toLowerCase().includes(s)) : POLICE_STATIONS
    return list.slice(0, 80)
  }, [q])

  function pick(p) { onChange(p.label); setQ(''); setOpen(false) }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button" id={id} onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-invalid={invalid}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-paper px-3.5 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          invalid ? 'border-destructive' : 'border-line'
        )}
      >
        <span className={cn('flex min-w-0 items-center gap-2', value ? 'text-ink' : 'text-stone')}>
          <MapPin className="h-4 w-4 shrink-0 text-clay" />
          <span className="truncate">{value || placeholder}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-stone transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-line bg-paper shadow-xl shadow-black/5">
          <div className="border-b border-line p-2">
            <input
              autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Type a thana or district…"
              className="h-9 w-full rounded-md border border-line bg-cream/40 px-3 text-sm text-ink placeholder:text-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {results.length === 0 && (
              <li className="px-3 py-3 text-sm text-stone">No match — check the spelling or pick the nearest thana.</li>
            )}
            {results.map((p) => (
              <li key={p.label} role="option" aria-selected={value === p.label}>
                <button type="button" onClick={() => pick(p)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-line/40">
                  <span className="min-w-0 flex-1 truncate text-ink">{p.thana}</span>
                  <span className="shrink-0 text-xs text-stone">{p.district}</span>
                  {value === p.label && <Check className="h-3.5 w-3.5 shrink-0 text-clay" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
