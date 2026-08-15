'use client'

// Lightweight stacked-bar chart (no chart library, no animation).
// buckets: [{ label, counts: {status: n}, total }]
// statuses: [{ value, label, color }]
export default function LeadsChart({ buckets, statuses }) {
  const max = Math.max(1, ...buckets.map((b) => b.total))
  const H = 190

  const hasAny = buckets.some((b) => b.total > 0)
  if (!hasAny) {
    return (
      <div className="grid h-48 place-items-center rounded-xl border border-dashed border-line text-sm text-stone">
        No leads in this period yet.
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="flex min-w-full items-end gap-1.5" style={{ height: H + 24 }}>
          {buckets.map((b, i) => (
            <div key={i} className="flex min-w-[14px] flex-1 flex-col items-center justify-end gap-1">
              <div
                className="flex w-full max-w-[34px] flex-col-reverse overflow-hidden rounded-md"
                style={{ height: H }}
                title={`${b.label}: ${b.total} lead${b.total === 1 ? '' : 's'}`}
              >
                {statuses.map((s) => {
                  const n = b.counts[s.value] || 0
                  if (!n) return null
                  return <div key={s.value} className="transition-[height] duration-300 ease-out" style={{ height: `${(n / max) * H}px`, backgroundColor: s.color }} />
                })}
                {b.total === 0 && <div className="h-[3px] w-full bg-line" />}
              </div>
              <span className="w-full truncate text-center text-[10px] text-stone">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {statuses.map((s) => (
          <span key={s.value} className="flex items-center gap-1.5 text-xs text-stone">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} /> {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
