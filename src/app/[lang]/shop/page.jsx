import { getAllProducts, toListProduct } from '@/lib/products'
import { getPublicCategories, nonEmptyCategories } from '@/lib/categories'
import { localized } from '@/lib/format'
import ShopView from '@/components/ShopView'
import { getServerT } from '@/i18n/server'
import { alternatesFor } from '@/i18n/config'

// Static + revalidated every 60s (and on demand when an admin saves a product).
// The ?q= / ?category= / ?popular= filters are applied in the browser, so the
// page no longer has to be re-rendered on the server (with a full product
// fetch) for every visit.
export const revalidate = 60

export function generateMetadata({ params }) {
  const t = getServerT(params.lang)
  return { title: t('meta.shopTitle'), description: t('meta.shopDescription'), alternates: alternatesFor('/shop', params.lang) }
}

export default async function ShopPage({ params }) {
  const { lang } = params
  const [products, categories] = await Promise.all([getAllProducts(), getPublicCategories()])
  // Products are sent to the browser once; ShopView handles the URL filters.
  const names = Object.fromEntries(categories.map((c) => [c.slug, localized(c, 'name', lang)]))
  return <ShopView products={products.map((p) => toListProduct(p, names))} categories={nonEmptyCategories(categories)} />
}
