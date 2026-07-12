import Link from 'next/link'
import ProductForm from '@/components/admin/ProductForm'

export default function NewProductPage() {
  return (
    <div>
      <Link href="/admin/products" className="text-sm text-stone hover:text-clay">← Back to products</Link>
      <h1 className="mt-3 mb-6 font-display text-3xl font-semibold text-ink">New product</h1>
      <ProductForm />
    </div>
  )
}
