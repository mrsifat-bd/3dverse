import { getAllProducts } from '@/lib/products'
import ShopBrowser from '@/components/ShopBrowser'

export const revalidate = 60

export const metadata = {
  title: 'Shop all products',
  description: 'Browse all 3DVerse products — anatomical models, keyrings, decor and gifts. Search, filter and order on WhatsApp.',
}

export default async function ShopPage({ searchParams }) {
  const products = await getAllProducts()
  const q = searchParams?.q || ''
  const category = searchParams?.category || 'all'

  return (
    <div className="container py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Shop all products</h1>
        <p className="mt-1 text-sm text-stone">Made-to-order 3D prints, ready to order on WhatsApp.</p>
      </header>
      <ShopBrowser products={products} initialQuery={q} initialCategory={category} />
    </div>
  )
}
