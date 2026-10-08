import { getAllProducts, toListProduct } from '@/lib/products'
import { getPublicCategories } from '@/lib/categories'
import ShopView from '@/components/ShopView'

// Static + revalidated every 60s (and on demand when an admin saves a product).
// The ?q= / ?category= / ?popular= filters are applied in the browser, so the
// page no longer has to be re-rendered on the server (with a full product
// fetch) for every visit.
export const revalidate = 60

export const metadata = {
  title: 'Shop all products',
  description: 'Browse all 3D Verse products — anatomical models, keyrings, decor and gifts. Search, filter, and check out with cash on delivery.',
  alternates: { canonical: '/shop' },
}

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getAllProducts(), getPublicCategories()])
  // Products are sent to the browser once; ShopView handles the URL filters.
  return <ShopView products={products.map(toListProduct)} categories={categories} />
}
