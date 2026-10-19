import Link from '@/components/LocalizedLink'
import { getServerT, getContent } from '@/i18n/server'

// Text with [label](/path) links -> React nodes (internal links keep the language).
export function RichText({ text }) {
  const parts = []
  const re = /\[([^\]]+)\]\((\/[^)\s]*)\)/g
  let last = 0
  let m
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(<Link key={m.index} href={m[2]} className="text-clay hover:underline">{m[1]}</Link>)
    last = re.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

// Shared layout for the help & policy pages (server component). The content
// comes from content/<lang>.js -> policies.<doc>; {vars} are filled in.
export default function PolicyPage({ lang, doc, vars = {} }) {
  const t = getServerT(lang)
  const d = getContent(lang, `policies.${doc}`)
  const fill = (s) => s.replace(/\{(\w+)\}/g, (all, k) => (vars[k] != null ? String(vars[k]) : all))
  return (
    <div className="container max-w-3xl py-12">
      <nav className="mb-6 flex items-center gap-1 text-xs text-stone" aria-label={t('common.breadcrumb')}>
        <Link href="/" className="hover:text-clay">{t('nav.home')}</Link><span>/</span>
        <span className="text-ink">{d.title}</span>
      </nav>
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{d.title}</h1>
      {d.updated && <p className="mt-2 text-xs text-stone">{t('policy.updated', { date: d.updated })}</p>}
      {d.intro && <p className="mt-6 text-base leading-relaxed text-stone">{d.intro}</p>}

      <div className="mt-10 space-y-10">
        {d.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-display text-xl font-semibold text-ink">{s.heading}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-stone">
              {s.body.map((b, i) => (Array.isArray(b)
                ? <ul key={i} className="list-disc space-y-1.5 pl-5">{b.map((li, j) => <li key={j}><RichText text={fill(li)} /></li>)}</ul>
                : <p key={i}><RichText text={fill(b)} /></p>))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-line bg-paper p-6 text-sm text-stone">
        <p className="font-medium text-ink">{t('policy.questions')}</p>
        <p className="mt-1">
          <RichText text={t('policy.see')} />{' '}
          {t('policy.related')} <Link href="/shipping-policy" className="text-clay hover:underline">{t('policy.shipping')}</Link> ·{' '}
          <Link href="/refund-policy" className="text-clay hover:underline">{t('policy.refunds')}</Link> ·{' '}
          <Link href="/privacy-policy" className="text-clay hover:underline">{t('policy.privacy')}</Link> ·{' '}
          <Link href="/terms" className="text-clay hover:underline">{t('policy.terms')}</Link>
        </p>
      </div>
    </div>
  )
}
