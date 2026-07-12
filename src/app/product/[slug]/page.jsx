import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { getProductBySlug, getRelatedProducts, getAllSlugs } from '@/lib/products'
import { formatPrice, allImages, firstImage } from '@/lib/format'
import { categoryName, BUSINESS, SITE_URL } from '@/lib/config'
import ProductGallery from '@/components/ProductGallery'
import ProductCard from '@/components/ProductCard'
import BuyButton from '@/components/BuyButton'

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const slugs = await getAllSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }) {
  const product = await getProductBySlug(params.slug)
  if (!product) return { title: 'Product not found' }
  const image = firstImage(product)
  return {
    title: product.name,
    description: product.description?.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160),
      images: image ? [image] : [],
      type: 'website',
    },
  }
}

export default async function ProductPage({ params }) {
  const product = await getProductBySlug(params.slug)
  if (!product) notFound()

  const related = await getRelatedProducts(product)
  const images = allImages(product)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: images,
    category: categoryName(product.category),
    brand: { '@type': 'Brand', name: BUSINESS.name },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'BDT',
      availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      url: `${SITE_URL}/product/${product.slug}`,
    },
  }

  return (
    <div className="container py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-stone" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-clay">Home</Link><span>/</span>
        <Link href="/shop" className="hover:text-clay">Shop</Link><span>/</span>
        <Link href={`/category/${product.category}`} className="hover:text-clay">{categoryName(product.category)}</Link><span>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={images} name={product.name} />

        <div>
          <Link href={`/category/${product.category}`} className="text-xs uppercase tracking-wide text-clay hover:underline">
            {categoryName(product.category)}
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink">{product.name}</h1>
          <p className="mt-4 text-2xl font-semibold text-ink">{formatPrice(product.price)}</p>
          <p className="mt-1 text-xs text-stone">{product.in_stock ? 'In stock · ready to print' : 'Made to order · ask for lead time'}</p>
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-stone">{product.description}</p>

          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <Link key={t} href={`/shop?q=${encodeURIComponent(t)}`} className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-stone hover:border-clay/40 hover:text-clay">#{t}</Link>
              ))}
            </div>
          )}

          <div className="mt-8">
            <BuyButton product={product} full />
            <p className="mt-3 text-center text-xs text-stone">Opens WhatsApp with your order details pre-filled. No payment needed online.</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">You may also like</h2>
            <Link href={`/category/${product.category}`} className="text-sm font-medium text-clay hover:underline">More <ArrowRight className="inline h-4 w-4" /></Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
