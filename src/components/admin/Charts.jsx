'use client'
// Small, dependency-free SVG charts for the admin dashboard. Colours come from
// the site's CSS variables so they work in light and dark mode. Every chart
// has a text summary for screen readers.
import { useMemo, useState } from 'react'

const CLAY = 'rgb(var(--clay))'
export const SERIES_COLORS = [CLAY, '#4E86B0', '#5B8A5B', '#C99A4E', '#9A6A62', '#7C6FB0']

const fmtNum = (n) => (Number(n) || 0).toLocaleString('en-IN')

function niceMax(v) {
  if (v <= 4) return 4
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}

// Line/area chart for one or more daily series. labels: x labels (same length as values).
export function TrendChart({ labels, series, height = 220, width = 640, format = fmtNum, ariaLabel }) {
  const [hover, setHover] = useState(null)
  const W = width
  const H = height
  const pad = { l: 48, r: 12, t: 12, b: 26 }
  const n = labels.length
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)))
  const x = (i) => pad.l + (n <= 1 ? 0 : (i * (W - pad.l - pad.r)) / (n - 1))
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max)
  const every = Math.max(1, Math.ceil(n / 8))
  const total = (s) => s.values.reduce((a, b) => a + b, 0)

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (n - 1))
    setHover(Math.min(n - 1, Math.max(0, i)))
  }

  return (
    <figure className="m-0">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-none" role="img"
          aria-label={ariaLabel || series.map((s) => `${s.name}: ${format(total(s))} total`).join('; ')}
          onMouseMove={onMove} onMouseLeave={() => setHover(null)} onTouchStart={(e) => onMove(e.touches[0] ? { clientX: e.touches[0].clientX, currentTarget: e.currentTarget } : e)}>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} stroke="rgb(var(--line))" strokeWidth="1" />
              <text x={pad.l - 6} y={y(max * f) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--stone))">{format(Math.round(max * f))}</text>
            </g>
          ))}
          {labels.map((l, i) => (i % every === 0 || i === n - 1) && (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="rgb(var(--stone))">{l}</text>
          ))}
          {series.map((s, si) => {
            const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
            const color = s.color || SERIES_COLORS[si]
            return (
              <g key={s.name}>
                {si === 0 && <polygon points={`${x(0)},${y(0)} ${pts} ${x(n - 1)},${y(0)}`} fill={color} opacity="0.12" />}
                <polyline points={pts} fill="none" stroke={color} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
                {hover !== null && <circle cx={x(hover)} cy={y(s.values[hover])} r="4" fill={color} stroke="rgb(var(--paper))" strokeWidth="2" />}
              </g>
            )
          })}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="rgb(var(--stone))" strokeDasharray="3 3" strokeWidth="1" />}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-1 rounded-lg border border-line bg-paper px-3 py-2 text-xs shadow-md"
            style={{ left: `${Math.min(70, Math.max(0, (x(hover) / W) * 100 - 10))}%` }}>
            <p className="font-medium text-ink">{labels[hover]}</p>
            {series.map((s, si) => (
              <p key={s.name} className="mt-0.5 flex items-center gap-1.5 text-stone">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color || SERIES_COLORS[si] }} />
                {s.name}: <span className="font-medium text-ink">{format(s.values[hover])}</span>
              </p>
            ))}
          </div>
        )}
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-4 text-xs text-stone">
        {series.map((s, si) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color || SERIES_COLORS[si] }} />
            {s.name} <span className="font-medium text-ink">{format(total(s))}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

// Vertical bars (e.g. orders per day).
export function ColumnChart({ labels, values, height = 200, width = 640, color = CLAY, format = fmtNum, name = 'Value' }) {
  const [hover, setHover] = useState(null)
  const W = width
  const H = height
  const pad = { l: 40, r: 8, t: 12, b: 26 }
  const n = labels.length
  const max = niceMax(Math.max(1, ...values))
  const bw = (W - pad.l - pad.r) / Math.max(1, n)
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max)
  const every = Math.max(1, Math.ceil(n / 8))
  const total = values.reduce((a, b) => a + b, 0)
  return (
    <figure className="m-0">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${name}: ${format(total)} total`} onMouseLeave={() => setHover(null)}>
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} stroke="rgb(var(--line))" />
              <text x={pad.l - 6} y={y(max * f) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--stone))">{format(Math.round(max * f))}</text>
            </g>
          ))}
          {values.map((v, i) => (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
              <rect x={pad.l + i * bw + bw * 0.15} y={y(v)} width={Math.max(1, bw * 0.7)} height={Math.max(0, H - pad.b - y(v))} rx="2"
                fill={color} opacity={hover === null || hover === i ? 1 : 0.45} />
              {(i % every === 0 || i === n - 1) && <text x={pad.l + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="rgb(var(--stone))">{labels[i]}</text>}
            </g>
          ))}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-1 rounded-lg border border-line bg-paper px-3 py-2 text-xs shadow-md"
            style={{ left: `${Math.min(70, Math.max(0, ((pad.l + hover * bw) / W) * 100 - 10))}%` }}>
            <p className="font-medium text-ink">{labels[hover]}</p>
            <p className="text-stone">{name}: <span className="font-medium text-ink">{format(values[hover])}</span></p>
          </div>
        )}
      </div>
    </figure>
  )
}

// Horizontal bars with labels (top products, pages, statuses, funnel).
export function BarList({ items, format = fmtNum, color = CLAY, empty = 'No data yet.', showRate = false }) {
  const max = useMemo(() => Math.max(1, ...items.map((i) => i.value)), [items])
  if (!items.length) return <p className="py-8 text-center text-sm text-stone">{empty}</p>
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={it.key || it.label + i}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-ink" title={it.label}>{it.label}</span>
            <span className="shrink-0 text-xs text-stone">
              <span className="font-medium text-ink">{format(it.value)}</span>
              {it.sub ? <span className="ml-1.5">{it.sub}</span> : null}
              {showRate && it.rate != null ? <span className="ml-1.5">({it.rate}%)</span> : null}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-line/60">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(it.value / max) * 100}%`, background: it.color || color }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

// One stacked bar split into parts (e.g. Mobile / Desktop / Tablet).
export function SplitBar({ parts, empty = 'No data yet.' }) {
  const total = parts.reduce((a, p) => a + p.value, 0)
  if (!total) return <p className="py-6 text-center text-sm text-stone">{empty}</p>
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-line/60" role="img" aria-label={parts.map((p) => `${p.label} ${p.pct}%`).join(', ')}>
        {parts.map((p, i) => <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: SERIES_COLORS[i % SERIES_COLORS.length] }} />)}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-stone">
        {parts.map((p, i) => (
          <li key={p.label} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
            {p.label} <span className="font-medium text-ink">{p.pct}%</span> ({fmtNum(p.value)})
          </li>
        ))}
      </ul>
    </div>
  )
}
