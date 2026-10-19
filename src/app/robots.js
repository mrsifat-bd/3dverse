import { SITE_URL } from '@/lib/config'

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/checkout', '/cart', '/api/', '/order', '/bn/account', '/bn/checkout', '/bn/cart', '/bn/order'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
