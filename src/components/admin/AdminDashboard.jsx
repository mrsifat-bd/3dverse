'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, CheckCircle, Layers, Plus, Loader2 } from 'lucide-react'
import { listProducts } from '@/lib/adminProducts'
import { CATEGORIES } from '@/lib/config'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  const [products, setProducts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listProducts().then(setProducts).catch((e) => { setError(e.message); setProducts([]) })
  }, [])

  if (products === null) {
    return <div className="flex items-center gap-2 py-16 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
  }

  const total = products.length
  const inStock = products.filter((p) => p.in_stock).length
  const categoriesUsed = new Set(products.map((p) => p.category)).size

  const stats = [
    { label: 'Total products', value: total, Icon: Package },
    { label: 'In stock', value: inStock, Icon: CheckCircle },
    { label: 'Categories', value: `${categoriesUsed}/${CATEGORIES.length}`, Icon: Layers },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">Dashboard</h1>
        <Button asChild><Link href="/admin/products/new"><Plus className="h-4 w-4" /> New product</Link></Button>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-2xl border border-line bg-paper p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-stone">{label}</p>
              <Icon className="h-5 w-5 text-clay" />
            </div>
            <p className="mt-3 font-display text-3xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-paper p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="ghost"><Link href="/admin/products">Manage products</Link></Button>
          <Button asChild variant="ghost"><Link href="/">View live site</Link></Button>
        </div>
      </div>
    </div>
  )
}
