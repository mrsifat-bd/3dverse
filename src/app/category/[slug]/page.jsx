import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CATEGORIES, categoryName } from '@/lib/config'
import { getProductsByCategory } from '@/lib/products'
import CategoryProducts from '@/components/CategoryProducts'

export const revalidate = 60

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }))
}

export function generateMetadata({ params }) {
  const category = CATEGORIES.find((c) => c.slug === params.slug)
  if (!category) return { title: 'Category' }
  return { title: category.name, description: category.blurb }
}

export default async function CategoryPage({ params }) {
  const category = CATEGORIES.find((c) => c.slug === params.slug)
  if (!category) notFound()
  const products = await getProductsByCategory(params.slug)

  return (
    <div className="container py-10">
      <nav className="mb-6 flex items-center gap-1 text-xs text-stone" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-clay">Home</Link><span>/</span>
        <Link href="/shop" className="hover:text-clay">Shop</Link><span>/</span>
        <span className="text-ink">{categoryName(params.slug)}</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink">{category.name}</h1>
        <p className="mt-1 max-w-xl text-sm text-stone">{category.blurb}</p>
      </header>

      <CategoryProducts products={products} />
    </div>
  )
}
