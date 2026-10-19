'use client'
import { useMemo, useState } from 'react'
import { Search, Flame } from 'lucide-react'
import { searchProducts, sortProducts } from '@/lib/products'
import ProductGrid from './ProductGrid'
import { Select } from './ui/select'
import { useLang, useT } from '@/i18n/client'
import { localized, formatNumber } from '@/lib/format'

// Client-side browser over a product list fetched on the server.
export default function ShopBrowser({ products, categories = [], initialQuery = '', initialCategory = 'all', initialPopular = false }) {
  const t = useT()
  const lang = useLang()
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
      <div className="mb-3 text-sm text-stone" aria-live="polite">{t(visible.length === 1 ? 'shop.countOne' : 'shop.count', { count: formatNumber(visible.length, lang) })}</div>
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 lg:max-w-md">
          <Search className="h-4 w-4 text-stone" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder={t('shop.searchPlaceholder')}
            aria-label={t('nav.search')}
            className="w-full bg-transparent text-sm text-ink placeholder:text-stone focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-pressed={popularOnly}
            onClick={() => setPopularOnly((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition duration-200 hover:scale-[1.02] active:scale-95 ${popularOnly ? 'border-clay bg-clay text-paper' : 'border-line text-ink hover:border-clay/40 hover:text-clay'}`}
          >
            <Flame className="h-4 w-4" /> {t('product.popular')}
          </button>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t('shop.category')}>
            <option value="all">{t('shop.allCategories')}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{localized(c, 'name', lang)}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('shop.sort')}>
            <option value="popular">{t('shop.sortPopular')}</option>
            <option value="newest">{t('shop.sortNewest')}</option>
            <option value="price-asc">{t('shop.sortPriceAsc')}</option>
            <option value="price-desc">{t('shop.sortPriceDesc')}</option>
          </Select>
        </div>
      </div>
      <ProductGrid products={visible} animateKey={`${category}|${sort}|${popularOnly}`} />
    </div>
  )
}
