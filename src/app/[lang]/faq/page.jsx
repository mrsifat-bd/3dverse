import Link from '@/components/LocalizedLink'
import { faqFor } from '@/lib/faq'
import { getServerT, getContent } from '@/i18n/server'
import { seo } from '@/i18n/seo'

export async function generateMetadata(props) {
  const params = await props.params;
  const t = getServerT(params.lang)
  return seo('/faq', params.lang, t('meta.faqTitle'), t('meta.faqDescription'))
}

export default async function FaqPage(props) {
  const params = await props.params;
  const { lang } = params
  const t = getServerT(lang)
  const c = getContent(lang, 'faqPage')
  const faq = faqFor(lang)
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return (
    <div className="container max-w-3xl py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <nav className="mb-6 flex items-center gap-1 text-xs text-stone" aria-label={t('common.breadcrumb')}>
        <Link href="/" className="hover:text-clay">{t('nav.home')}</Link><span>/</span><span className="text-ink">{t('footer.faq')}</span>
      </nav>
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{c.title}</h1>
      <p className="mt-3 text-base text-stone">{c.intro}</p>

      <div className="mt-8 space-y-3">
        {faq.map((f) => (
          <details key={f.q} className="disclosure group rounded-xl border border-line bg-paper px-5 py-4">
            <summary className="cursor-pointer list-none text-sm font-medium text-ink marker:hidden">{f.q}</summary>
            <p className="mt-2 text-sm leading-relaxed text-stone">{f.a}</p>
          </details>
        ))}
      </div>

      <p className="mt-12 text-sm text-stone">
        {c.more} <Link href="/shipping-policy" className="text-clay hover:underline">{t('footer.shipping')}</Link> ·{' '}
        <Link href="/refund-policy" className="text-clay hover:underline">{t('footer.refunds')}</Link> ·{' '}
        <Link href="/track" className="text-clay hover:underline">{t('footer.track')}</Link> ·{' '}
        <Link href="/contact" className="text-clay hover:underline">{t('footer.contact')}</Link>
      </p>
    </div>
  );
}
