'use client'
import { useMemo, useState } from 'react'
import { sortProducts } from '@/lib/products'
import ProductGrid from './ProductGrid'
import { Select } from './ui/select'
import { useLang, useT } from '@/i18n/client'
import { formatNumber } from '@/lib/format'

export default function CategoryProducts({ products }) {
  const t = useT()
  const lang = useLang()
  const [sort, setSort] = useState('popular')
  const visible = useMemo(() => sortProducts(products, sort), [products, sort])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm text-stone">{t(visible.length === 1 ? 'shop.countOne' : 'shop.count', { count: formatNumber(visible.length, lang) })}</span>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('shop.sort')}>
          <option value="popular">{t('shop.sortPopular')}</option>
          <option value="newest">{t('shop.sortNewest')}</option>
          <option value="price-asc">{t('shop.sortPriceAsc')}</option>
          <option value="price-desc">{t('shop.sortPriceDesc')}</option>
        </Select>
      </div>
      <ProductGrid products={visible} animateKey={sort} />
    </div>
  )
}
