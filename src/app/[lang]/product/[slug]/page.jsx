import Link from '@/components/LocalizedLink'
import { notFound } from 'next/navigation'
import { ArrowRight, Star } from 'lucide-react'
import { getProductBySlug, getRelatedProducts, getAllSlugs, productSeoTitle, getReviewSummary, toListProduct } from '@/lib/products'
import { getCategoryNames } from '@/lib/categories'
import { formatPrice, formatNumber, allImages, firstImage, hasDiscount, effectivePrice, productVideoUrl, localized } from '@/lib/format'
import { categoryName, SITE_URL } from '@/lib/config'
import ProductGallery from '@/components/ProductGallery'
import ProductCard from '@/components/ProductCard'
import AddToCartButton from '@/components/AddToCartButton'
import BuyNowButton from '@/components/BuyNowButton'
import LikeButton from '@/components/LikeButton'
import WishlistButton from '@/components/WishlistButton'
import LeadTracker from '@/components/LeadTracker'
import ProductFaq from '@/components/ProductFaq'
import ProductReviews from '@/components/ProductReviews'
import { getServerT } from '@/i18n/server'
import { alternatesFor, localizeHref, INTL_LOCALE } from '@/i18n/config'

export const revalidate = 60
// Products/categories added after a deploy are rendered on first visit.
export const dynamicParams = true

export async function generateStaticParams() {
  try {
    const slugs = await getAllSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch {
    return []
  }
}

export async function generateMetadata(props) {
  const params = await props.params;
  const { lang } = params
  const t = getServerT(lang)
  const product = await getProductBySlug(params.slug)
  if (!product) return { title: t('meta.notFoundTitle'), robots: { index: false } }
  const image = firstImage(product)
  const name = localized(product, 'name', lang)
  const title = lang === 'bn' ? t('meta.productTitle', { name }) : productSeoTitle(product)
  const price = formatPrice(effectivePrice(product), lang)
  const summary = String(localized(product, 'description', lang) || '').replace(/\s+/g, ' ').trim()
  const description = t('meta.productDescription', { name, price, summary }).slice(0, 158)
  const alt = alternatesFor(`/product/${product.slug}`, lang)
  return {
    title,
    description,
    alternates: alt,
    openGraph: {
      title: `${title} | 3D Verse BD`,
      description,
      url: alt.canonical,
      locale: INTL_LOCALE[lang].replace('-', '_'),
      alternateLocale: [lang === 'bn' ? 'en_US' : 'bn_BD'],
      siteName: '3D Verse BD',
      // Without a product photo the site-wide share image is used instead.
      ...(image && /^https?:\/\//.test(image) ? { images: [{ url: image, alt: product.name }] } : {}),
      type: 'website',
    },
  };
}

export default async function ProductPage(props) {
  const params = await props.params;
  const { lang } = params
  const t = getServerT(lang)
  const product = await getProductBySlug(params.slug)
  if (!product) notFound()

  const [related, catNames, ratings] = await Promise.all([
    getRelatedProducts(product),
    getCategoryNames(lang),
    getReviewSummary(product.id),
  ])
  // Bangla where it has been entered; otherwise the official English text,
  // marked lang="en" so screen readers pronounce it correctly.
  const name = localized(product, 'name', lang)
  const nameIsFallback = lang === 'bn' && !product.name_bn
  const description = localized(product, 'description', lang)
  const descIsFallback = lang === 'bn' && !product.description_bn
  const catName = categoryName(product.category, catNames)
  const price = effectivePrice(product)
  const images = allImages(product)
  // Video CTA shows ONLY when THIS product has its own valid video link.
  // No category-based or global fallback — a videoless product never inherits
  // another product's (or the site-wide) video.
  const reviewUrl = productVideoUrl(product)

  const productUrl = `${SITE_URL}${localizeHref(`/product/${product.slug}`, lang)}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: images.filter((u) => /^https?:\/\//.test(u)),
    sku: product.slug,
    category: catName,
    brand: { '@type': 'Brand', name: '3D Verse BD' },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'BDT',
      availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      itemCondition: 'https://schema.org/NewCondition',
      url: productUrl,
      seller: { '@type': 'Organization', name: '3D Verse BD' },
    },
    // Only real, approved customer ratings — never invented.
    ...(ratings.count > 0
      ? {
          aggregateRating: { '@type': 'AggregateRating', ratingValue: ratings.average, reviewCount: ratings.count, bestRating: 5, worstRating: 1 },
          review: ratings.reviews.slice(0, 5).map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.user_name || 'Customer' },
            datePublished: String(r.created_at).slice(0, 10),
            reviewBody: r.comment,
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
          })),
        }
      : {}),
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('nav.home'), item: `${SITE_URL}${localizeHref('/', lang)}` },
      { '@type': 'ListItem', position: 2, name: t('nav.shop'), item: `${SITE_URL}${localizeHref('/shop', lang)}` },
      { '@type': 'ListItem', position: 3, name: catName, item: `${SITE_URL}${localizeHref(`/category/${product.category}`, lang)}` },
      { '@type': 'ListItem', position: 4, name, item: productUrl },
    ],
  }

  return (
    <div className="container py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, '\\u003c') }} />
      <LeadTracker product={{ id: product.id, name: product.name, slug: product.slug, category: product.category }} />

      <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-stone" aria-label={t('common.breadcrumb')}>
        <Link href="/" className="hover:text-clay">{t('nav.home')}</Link><span>/</span>
        <Link href="/shop" className="hover:text-clay">{t('nav.shop')}</Link><span>/</span>
        <Link href={`/category/${product.category}`} className="hover:text-clay">{catName}</Link><span>/</span>
        <span className="text-ink" lang={nameIsFallback ? 'en' : undefined}>{name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={images} name={name} />

        <div>
          <Link href={`/category/${product.category}`} className="text-xs uppercase tracking-wide text-clay hover:underline">
            {catName}
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink" lang={nameIsFallback ? 'en' : undefined}>{name}</h1>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <p className="text-2xl font-semibold text-ink">{formatPrice(price, lang)}</p>
            {hasDiscount(product) && (
              <>
                <p className="text-lg text-stone line-through">{formatPrice(product.price, lang)}</p>
                <span className="rounded-full bg-clay px-2.5 py-0.5 text-xs font-medium text-paper">{t('product.percentOff', { n: formatNumber(product.discount_percent, lang) })}</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-stone">{product.in_stock ? t('product.inStock') : t('product.madeToOrderLead')}</p>
          {ratings.count > 0 && (
            <a href="#reviews" className="mt-2 inline-flex items-center gap-1.5 text-sm text-stone hover:text-clay">
              <span className="flex" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= Math.round(ratings.average) ? 'fill-clay text-clay' : 'text-line'}`} />
                ))}
              </span>
              <span>{formatNumber(ratings.average, lang)} · {t(ratings.count === 1 ? 'product.reviewsOne' : 'product.reviews', { count: formatNumber(ratings.count, lang) })}</span>
            </a>
          )}
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-stone" lang={descIsFallback ? 'en' : undefined}>{description}</p>

          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Link key={tag} href={`/shop?q=${encodeURIComponent(tag)}`} lang="en" className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-stone hover:border-clay/40 hover:text-clay">#{tag}</Link>
              ))}
            </div>
          )}

          <div className="mt-8 space-y-3">
            <AddToCartButton product={product} full />
            <div className="flex gap-3">
              <BuyNowButton product={product} full />
              <WishlistButton productId={product.id} variant="inline" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <LikeButton productId={product.id} />
              <span className="text-xs font-medium text-clay">{t('product.paymentShort')}</span>
            </div>
            {reviewUrl && (
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-clay/40 hover:text-clay"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.76-1.77C19.28 5.1 12 5.1 12 5.1s-7.28 0-8.84.43A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.76 1.77C4.72 18.9 12 18.9 12 18.9s7.28 0 8.84-.43a2.5 2.5 0 0 0 1.76-1.77C23 15.2 23 12 23 12zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" /></svg>
                {t('product.watchVideo')}
              </a>
            )}
            {product.extra_link && (
              <a
                href={product.extra_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-clay/40 hover:text-clay"
              >
                {product.extra_link_label || t('product.learnMore')}
              </a>
            )}
            <p className="text-center text-xs text-stone">{t('product.paymentNote')}</p>
          </div>
        </div>
      </div>

      <ProductFaq faqs={product.faqs} />

      <ProductReviews productId={product.id} />

      {related.length > 0 && (
        <section className="mt-20">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">{t('product.related')}</h2>
            <Link href={`/category/${product.category}`} className="text-sm font-medium text-clay hover:underline">{t('product.more')} <ArrowRight className="inline h-4 w-4" /></Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={toListProduct(p, catNames)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
