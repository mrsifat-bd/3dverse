import Link from 'next/link'

// Shared layout for the help & policy pages. Server component.
//   sections: [{ heading, body: [string | ReactNode] }]
//   bn: a short Bangla summary shown at the top (optional)
export default function PolicyPage({ title, updated, intro, bn, sections = [], children }) {
  return (
    <div className="container max-w-3xl py-12">
      <nav className="mb-6 flex items-center gap-1 text-xs text-stone" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-clay">Home</Link><span>/</span>
        <span className="text-ink">{title}</span>
      </nav>
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
      {updated && <p className="mt-2 text-xs text-stone">Last updated: {updated}</p>}
      {intro && <p className="mt-6 text-base leading-relaxed text-stone">{intro}</p>}

      {bn && (
        <div lang="bn" className="mt-6 rounded-2xl border border-clay/30 bg-clay/5 p-5 font-bangla text-sm leading-relaxed text-ink">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-clay">সংক্ষেপে</p>
          {bn}
        </div>
      )}

      <div className="mt-10 space-y-10">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-display text-xl font-semibold text-ink">{s.heading}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-stone">
              {s.body.map((b, i) => (Array.isArray(b)
                ? <ul key={i} className="list-disc space-y-1.5 pl-5">{b.map((li, j) => <li key={j}>{li}</li>)}</ul>
                : <p key={i}>{b}</p>))}
            </div>
          </section>
        ))}
      </div>

      {children}

      <div className="mt-14 rounded-2xl border border-line bg-paper p-6 text-sm text-stone">
        <p className="font-medium text-ink">Questions?</p>
        <p className="mt-1">
          See the <Link href="/faq" className="text-clay hover:underline">FAQ</Link>, or <Link href="/contact" className="text-clay hover:underline">contact us</Link>.
          Related: <Link href="/shipping-policy" className="text-clay hover:underline">Shipping</Link> ·{' '}
          <Link href="/refund-policy" className="text-clay hover:underline">Refunds &amp; returns</Link> ·{' '}
          <Link href="/privacy-policy" className="text-clay hover:underline">Privacy</Link> ·{' '}
          <Link href="/terms" className="text-clay hover:underline">Terms</Link>
        </p>
      </div>
    </div>
  )
}
