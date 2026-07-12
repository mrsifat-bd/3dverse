'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getProduct } from '@/lib/adminProducts'
import ProductForm from '@/components/admin/ProductForm'

export default function EditProductPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(undefined)
  const [error, setError] = useState('')

  useEffect(() => {
    getProduct(id).then((p) => setProduct(p || null)).catch((e) => { setError(e.message); setProduct(null) })
  }, [id])

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-stone hover:text-clay">← Back to products</Link>
      <h1 className="mt-3 mb-6 font-display text-3xl font-semibold text-ink">Edit product</h1>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {product === undefined ? (
        <div className="flex items-center gap-2 py-16 text-stone"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
      ) : product === null ? (
        <p className="text-sm text-stone">Product not found.</p>
      ) : (
        <ProductForm initial={product} />
      )}
    </div>
  )
}
