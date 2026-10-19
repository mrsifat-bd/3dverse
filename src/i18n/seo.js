import { SITE_URL } from '@/lib/config'
import { alternatesFor } from './config'

const BRAND = '3D Verse BD'
const OG_LOCALE = { en: 'en_US', bn: 'bn_BD' }

// Page metadata in the page's own language: title, description, canonical +
// hreflang, and matching Open Graph / Twitter tags. Without this, pages that
// only set a title inherited the site-wide English share text and an og:url
// pointing at the home page.
export function seo(path, lang, title, description, { absoluteTitle = false } = {}) {
  const alternates = alternatesFor(path, lang)
  const full = absoluteTitle ? title : `${title} | ${BRAND}`
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates,
    openGraph: {
      title: full,
      description,
      url: `${SITE_URL}${alternates.canonical === '/' ? '' : alternates.canonical}`,
      siteName: BRAND,
      locale: OG_LOCALE[lang] || OG_LOCALE.en,
      alternateLocale: [lang === 'bn' ? OG_LOCALE.en : OG_LOCALE.bn],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: full, description },
  }
}
