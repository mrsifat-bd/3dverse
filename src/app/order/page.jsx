import Link from 'next/link'
import Image from 'next/image'
import { getProductBySlug } from '@/lib/products'
import { effectivePrice, firstImage } from '@/lib/format'
import { categoryName } from '@/lib/config'
import OrderForm from '@/components/OrderForm'

export const metadata = {
  title: 'Place an order',
  description: 'Provide your delivery details to order from 3D Verse with cash on delivery.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/order' },
}

export default async function OrderPage({ searchParams }) {
  const slug = searchParams?.product
  const product = slug ? await getProductBySlug(slug) : null

  if (!product) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-line bg-paper p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Start from a product</h1>
          <p className="mt-2 text-sm text-stone">Pick a product first, then tap “Order for home delivery”.</p>
          <Link href="/shop" className="btn-primary mt-6">Browse products</Link>
        </div>
      </div>
    )
  }

  const image = firstImage(product)
  const p = { id: product.id, name: product.name, slug: product.slug, unit_price: effectivePrice(product) }

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-lg">
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-stone" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-clay">Home</Link><span>/</span>
          <Link href={`/product/${product.slug}`} className="hover:text-clay">{product.name}</Link><span>/</span>
          <span className="text-ink">Order</span>
        </nav>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-cream">
            {image && <Image src={image} alt="" fill sizes="64px" className="object-cover" />}
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide text-clay">{categoryName(product.category)}</span>
            <h1 className="font-display text-2xl font-semibold leading-tight text-ink">Home delivery order</h1>
          </div>
        </div>

        <OrderForm product={p} />

        <p className="mt-6 text-center text-xs text-stone">
          Prefer WhatsApp? <Link href={`/product/${product.slug}`} className="text-clay hover:underline">Go back and use “Buy Now on WhatsApp”.</Link>
        </p>
      </div>
    </div>
  )
}
