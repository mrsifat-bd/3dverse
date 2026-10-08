'use client'
import { useSearchParams } from 'next/navigation'
import ShopBrowser from './ShopBrowser'

export default function ShopView({ products, categories, q = '', category = 'all', popular = false }) {
  return (
    <div className="container py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink">{popular ? 'Popular products' : 'Shop all products'}</h1>
        <p className="mt-1 text-sm text-stone">Made-to-order 3D prints, ready to order on WhatsApp.</p>
      </header>
      <ShopBrowser
        // Remount when the URL filters change (e.g. a new search from the navbar).
        key={`${q}|${category}|${popular}`}
        products={products}
        categories={categories}
        initialQuery={q}
        initialCategory={category}
        initialPopular={popular}
      />
    </div>
  )
}

// Reads the shop filters from the URL in the browser.
export function ShopViewFromParams({ products, categories }) {
  const sp = useSearchParams()
  const q = sp.get('q') || ''
  const category = sp.get('category') || 'all'
  const popularParam = sp.get('popular')
  const popular = popularParam === '1' || popularParam === 'true'
  return <ShopView products={products} categories={categories} q={q} category={category} popular={popular} />
}
