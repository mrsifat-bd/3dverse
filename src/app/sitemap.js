import { SITE_URL } from '@/lib/config'
import { getAllProducts } from '@/lib/products'
import { getPublicCategories, nonEmptyCategories } from '@/lib/categories'

// Rebuilt at most once an hour, so new products and categories appear
// without a redeploy.
export const revalidate = 3600

const STATIC_PAGES = [
  ['', 1, 'daily'],
  ['/shop', 0.9, 'daily'],
  ['/about', 0.5, 'monthly'],
  ['/contact', 0.5, 'monthly'],
  ['/faq', 0.5, 'monthly'],
  ['/shipping-policy', 0.3, 'yearly'],
  ['/refund-policy', 0.3, 'yearly'],
  ['/privacy-policy', 0.2, 'yearly'],
  ['/terms', 0.2, 'yearly'],
  ['/track', 0.3, 'yearly'],
]

export default async function sitemap() {
  const now = new Date()
  const staticRoutes = STATIC_PAGES.map(([p, priority, changeFrequency]) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))

  let categoryRoutes = []
  try {
    categoryRoutes = nonEmptyCategories(await getPublicCategories()).map((c) => ({
      url: `${SITE_URL}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  } catch {}

  let productRoutes = []
  try {
    const products = await getAllProducts()
    productRoutes = products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: p.updated_at || p.created_at || now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  } catch {}

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}
