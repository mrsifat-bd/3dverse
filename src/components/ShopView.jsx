'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ShopBrowser from './ShopBrowser'

const DEFAULTS = { q: '', category: 'all', popular: false }

function readParams(sp) {
  const p = sp.get('popular')
  return { q: sp.get('q') || '', category: sp.get('category') || 'all', popular: p === '1' || p === 'true' }
}

// Reads ?q= ?category= ?popular= and reports changes. It is the only part that
// needs the URL, so it sits in its own tiny Suspense boundary: the product grid
// itself is server-rendered and hydrated as-is. (Previously the whole grid sat
// inside the boundary and was rendered a second time on load — ~280 ms of
// blocking work on the live shop page.)
function ParamsSync({ onChange }) {
  const sp = useSearchParams()
  const key = sp.toString()
  useEffect(() => {
    onChange(readParams(sp))
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function ShopView({ products, categories }) {
  const [f, setF] = useState(DEFAULTS)
  const update = (next) =>
    setF((cur) => (cur.q === next.q && cur.category === next.category && cur.popular === next.popular ? cur : next))

  return (
    <div className="container py-10">
      <Suspense fallback={null}>
        <ParamsSync onChange={update} />
      </Suspense>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink">{f.popular ? 'Popular products' : 'Shop all products'}</h1>
        <p className="mt-1 text-sm text-stone">Made-to-order 3D prints. Add to cart and check out here: delivery charge via bKash, product price cash on delivery.</p>
      </header>
      <ShopBrowser
        // Remount when the URL filters change (e.g. a new search from the navbar).
        key={`${f.q}|${f.category}|${f.popular}`}
        products={products}
        categories={categories}
        initialQuery={f.q}
        initialCategory={f.category}
        initialPopular={f.popular}
      />
    </div>
  )
}
