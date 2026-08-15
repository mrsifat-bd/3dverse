'use client'
import { useMemo, useState } from 'react'
import { Search, Flame } from 'lucide-react'
import { searchProducts, sortProducts } from '@/lib/products'
import ProductGrid from './ProductGrid'
import { Select } from './ui/select'

// Client-side browser over a product list fetched on the server.
export default function ShopBrowser({ products, categories = [], initialQuery = '', initialCategory = 'all', initialPopular = false }) {
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [sort, setSort] = useState('popular')
  const [popularOnly, setPopularOnly] = useState(initialPopular)

  const visible = useMemo(() => {
    let list = products
    if (popularOnly) list = list.filter((p) => p.is_popular)
    if (category !== 'all') list = list.filter((p) => p.category === category)
    list = searchProducts(list, query)
    return sortProducts(list, sort)
  }, [products, query, category, sort, popularOnly])

  return (
    <div>
      <div className="mb-3 text-sm text-stone">{visible.length} product{visible.length === 1 ? '' : 's'}</div>
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 lg:max-w-md">
          <Search className="h-4 w-4 text-stone" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search by name, tag or category…"
            aria-label="Search products"
            className="w-full bg-transparent text-sm text-ink placeholder:text-stone focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPopularOnly((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95 ${popularOnly ? 'border-clay bg-clay text-paper' : 'border-line text-ink hover:border-clay/40 hover:text-clay'}`}
          >
            <Flame className="h-4 w-4" /> Popular
          </button>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="popular">Popular first</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </Select>
        </div>
      </div>
      <ProductGrid products={visible} animateKey={`${category}|${sort}|${popularOnly}`} />
    </div>
  )
}
