import Link from '@/components/LocalizedLink'
import { notFound } from 'next/navigation'
import { getProductsByCategory, toListProduct } from '@/lib/products'
import { getPublicCategories, getCategoryBySlug } from '@/lib/categories'
import { SITE_URL } from '@/lib/config'
import { localized } from '@/lib/format'
import CategoryProducts from '@/components/CategoryProducts'
import { getServerT, getContent } from '@/i18n/server'
import { alternatesFor, localizeHref } from '@/i18n/config'

export const revalidate = 60
// Products/categories added after a deploy are rendered on first visit.
export const dynamicParams = true

export async function generateStaticParams() {
  const cats = await getPublicCategories()
  return cats.map((c) => ({ slug: c.slug }))
}

function blurbFor(category, lang) {
  if (lang !== 'bn') return category.blurb
  return (getContent('bn', 'categoryBlurbs') || {})[category.slug] || category.blurb
}

export async function generateMetadata({ params }) {
  const { lang } = params
  const t = getServerT(lang)
  const category = await getCategoryBySlug(params.slug)
  if (!category) return { title: t('meta.notFoundTitle'), robots: { index: false } }
  const name = localized(category, 'name', lang)
  const blurb = blurbFor(category, lang)
  const description = `${blurb ? `${blurb} ` : ''}${t('meta.categoryDescription', { name: lang === 'bn' ? name : name.toLowerCase() })}`
  return {
    title: t('meta.categoryTitle', { name }),
    description: description.slice(0, 158),
    alternates: alternatesFor(`/category/${category.slug}`, lang),
  }
}

export default async function CategoryPage({ params }) {
  const { lang } = params
  const t = getServerT(lang)
  const category = await getCategoryBySlug(params.slug)
  if (!category) notFound()
  const [products, cats] = await Promise.all([getProductsByCategory(params.slug), getPublicCategories()])
  const names = Object.fromEntries(cats.map((c) => [c.slug, localized(c, 'name', lang)]))
  const name = localized(category, 'name', lang)
  const blurb = blurbFor(category, lang)

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('nav.home'), item: `${SITE_URL}${localizeHref('/', lang)}` },
      { '@type': 'ListItem', position: 2, name: t('nav.shop'), item: `${SITE_URL}${localizeHref('/shop', lang)}` },
      { '@type': 'ListItem', position: 3, name, item: `${SITE_URL}${localizeHref(`/category/${category.slug}`, lang)}` },
    ],
  }

  return (
    <div className="container py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, '\\u003c') }} />
      <nav className="mb-6 flex items-center gap-1 text-xs text-stone" aria-label={t('common.breadcrumb')}>
        <Link href="/" className="hover:text-clay">{t('nav.home')}</Link><span>/</span>
        <Link href="/shop" className="hover:text-clay">{t('nav.shop')}</Link><span>/</span>
        <span className="text-ink">{name}</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink">{name}</h1>
        {blurb && <p className="mt-1 max-w-xl text-sm text-stone">{blurb}</p>}
        <p className="mt-2 max-w-xl text-sm text-stone">{t('category.note')}</p>
      </header>

      <CategoryProducts products={products.map((p) => toListProduct(p, names))} />
    </div>
  )
}
