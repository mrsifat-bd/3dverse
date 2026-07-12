'use client'
import { useMemo, useState } from 'react'
import { sortProducts } from '@/lib/products'
import ProductGrid from './ProductGrid'
import { Select } from './ui/select'

export default function CategoryProducts({ products }) {
  const [sort, setSort] = useState('newest')
  const visible = useMemo(() => sortProducts(products, sort), [products, sort])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm text-stone">{visible.length} product{visible.length === 1 ? '' : 's'}</span>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </Select>
      </div>
      <ProductGrid products={visible} />
    </div>
  )
}
