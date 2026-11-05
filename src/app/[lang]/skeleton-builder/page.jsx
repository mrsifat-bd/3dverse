import Link from '@/components/LocalizedLink'
import { getServerT } from '@/i18n/server'
import { seo } from '@/i18n/seo'
import { SITE_URL } from '@/lib/config'
import { getSkeletonCatalog } from '@/lib/skeleton/server'
import { SECTIONS } from '@/lib/skeleton/catalog'
import SkeletonBuilder from '@/components/skeleton/SkeletonBuilder'

// Prices and availability come from the database; refreshed every 5 minutes.
export const revalidate = 300

export async function generateMetadata(props) {
  const { lang } = await props.params
  const t = getServerT(lang)
  return seo('/skeleton-builder', lang, t('builder.metaTitle'), t('builder.metaDescription'))
}

export default async function SkeletonBuilderPage(props) {
  const { lang } = await props.params
  const t = getServerT(lang)
  const { catalog, live } = await getSkeletonCatalog()
  const base = `${SITE_URL}${lang === 'bn' ? '/bn' : ''}`
  const bundles = catalog.bundles.filter((b) => b.is_active)
  const ld = [
    ...bundles.map((b) => ({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: b.name_en,
      description: lang === 'bn' ? t('builder.metaDescription') : `${b.name_en}: 3D printed human bone models, made to order in Sylhet by 3D Verse.`,
      brand: { '@type': 'Brand', name: '3D Verse BD' },
      url: `${base}/skeleton-builder`,
      offers: { '@type': 'Offer', price: String(b.price), priceCurrency: 'BDT', availability: 'https://schema.org/InStock', url: `${base}/skeleton-builder` },
    })),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: t('builder.title'),
      itemListElement: catalog.items.filter((i) => i.listed && i.is_active && i.product_slug).map((i, n) => ({
        '@type': 'ListItem', position: n + 1, name: i.name_en, url: `${base}/product/${i.product_slug}`,
      })),
    },
  ]
  return (
    <div className="container max-w-[1400px] py-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <nav className="mb-4 flex items-center gap-1 text-xs text-stone" aria-label={t('common.breadcrumb')}>
        <Link href="/" className="hover:text-clay">{t('nav.home')}</Link><span>/</span>
        <Link href="/category/medical-bone-models" className="hover:text-clay">{t('nav.medical')}</Link><span>/</span>
        <span className="text-ink">{t('builder.breadcrumb')}</span>
      </nav>
      <header className="mb-5 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{t('builder.title')}</h1>
        <p className="mt-2 text-base leading-relaxed text-stone">{t('builder.intro')}</p>
      </header>
      <SkeletonBuilder catalog={catalog} sections={SECTIONS} live={live} />
      <section className="mt-10 max-w-3xl border-t border-line pt-5 text-xs leading-relaxed text-stone">
        <h2 className="font-medium text-ink">{t('builder.creditsTitle')}</h2>
        <p className="mt-1">{t('builder.credits')}</p>
        <p className="mt-1"><a href="/models/skeleton-LICENSE.txt" className="text-clay hover:underline">{t('builder.licence')}</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="license noopener" target="_blank" className="text-clay hover:underline">CC BY-SA 4.0</a></p>
      </section>
    </div>
  )
}
