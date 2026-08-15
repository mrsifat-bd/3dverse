import { getAllProducts } from '@/lib/products'
import { getPublicCategories } from '@/lib/categories'
import ShopBrowser from '@/components/ShopBrowser'

export const revalidate = 60

export const metadata = {
  title: 'Shop all products',
  description: 'Browse all 3D Verse products — anatomical models, keyrings, decor and gifts. Search, filter, and check out with cash on delivery.',
  alternates: { canonical: '/shop' },
}

export default async function ShopPage({ searchParams }) {
  const [products, categories] = await Promise.all([getAllProducts(), getPublicCategories()])
  const q = searchParams?.q || ''
  const category = searchParams?.category || 'all'
  const popular = searchParams?.popular === '1' || searchParams?.popular === 'true'

  return (
    <div className="container py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink">{popular ? 'Popular products' : 'Shop all products'}</h1>
        <p className="mt-1 text-sm text-stone">Made-to-order 3D prints, ready to order on WhatsApp.</p>
      </header>
      <ShopBrowser products={products} categories={categories} initialQuery={q} initialCategory={category} initialPopular={popular} />
    </div>
  )
}
