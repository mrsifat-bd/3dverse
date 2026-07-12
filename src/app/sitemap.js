import { SITE_URL, CATEGORIES } from '@/lib/config'
import { getAllSlugs } from '@/lib/products'

export default async function sitemap() {
  const staticRoutes = ['', '/shop', '/about', '/contact'].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: p === '' ? 1 : 0.7,
  }))

  const categoryRoutes = CATEGORIES.map((c) => ({
    url: `${SITE_URL}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  let productRoutes = []
  try {
    const slugs = await getAllSlugs()
    productRoutes = slugs.map((slug) => ({
      url: `${SITE_URL}/product/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  } catch {
    productRoutes = []
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}
