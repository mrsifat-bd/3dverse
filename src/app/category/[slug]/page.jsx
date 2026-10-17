import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProductsByCategory, toListProduct } from '@/lib/products'
import { getPublicCategories, getCategoryBySlug } from '@/lib/categories'
import { SITE_URL } from '@/lib/config'
import CategoryProducts from '@/components/CategoryProducts'

export const revalidate = 60

export async function generateStaticParams() {
  const cats = await getPublicCategories()
  return cats.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }) {
  const category = await getCategoryBySlug(params.slug)
  if (!category) return { title: 'Category not found', robots: { index: false } }
  const description = (category.blurb ? `${category.blurb} ` : '') +
    `3D printed ${category.name.toLowerCase()} made to order in Sylhet, delivered across Bangladesh. Order online with cash on delivery.`
  return {
    title: `3D Printed ${category.name} in Bangladesh`,
    description: description.slice(0, 158),
    alternates: { canonical: `/category/${category.slug}` },
  }
}

export default async function CategoryPage({ params }) {
  const category = await getCategoryBySlug(params.slug)
  if (!category) notFound()
  const [products, cats] = await Promise.all([getProductsByCategory(params.slug), getPublicCategories()])
  const names = Object.fromEntries(cats.map((c) => [c.slug, c.name]))

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
      { '@type': 'ListItem', position: 3, name: category.name, item: `${SITE_URL}/category/${category.slug}` },
    ],
  }

  return (
    <div className="container py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, '\\u003c') }} />
      <nav className="mb-6 flex items-center gap-1 text-xs text-stone" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-clay">Home</Link><span>/</span>
        <Link href="/shop" className="hover:text-clay">Shop</Link><span>/</span>
        <span className="text-ink">{category.name}</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink">{category.name}</h1>
        {category.blurb && <p className="mt-1 max-w-xl text-sm text-stone">{category.blurb}</p>}
        <p lang="bn" className="mt-2 max-w-xl font-bangla text-sm text-stone">
          {category.name} — ৩ডি প্রিন্টেড পণ্য, সিলেটে তৈরি। অনলাইনে অর্ডার করুন, পণ্যের দাম ক্যাশ অন ডেলিভারি, সারা বাংলাদেশে ডেলিভারি।
        </p>
      </header>

      <CategoryProducts products={products.map((p) => toListProduct(p, names))} />
    </div>
  )
}
