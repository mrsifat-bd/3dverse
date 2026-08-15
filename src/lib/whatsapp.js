import { BUSINESS, SITE_URL, REVIEW_URL } from './config'
import { formatPrice, effectivePrice } from './format'

// Builds a wa.me order link with a Bangla pre-filled message.
// `settings` (optional) overrides the WhatsApp number and review link from the CMS.
export function buildWhatsappOrderUrl(product, settings = {}) {
  const number = settings.whatsapp_number || BUSINESS.whatsappNumber
  // Always use the canonical site URL so shared order links point to the real
  // domain regardless of which host the visitor happens to be on.
  const productUrl = `${SITE_URL}/product/${product.slug}`

  const reviewUrl =
    product.review_url ||
    (product.category === 'medical-bone-models' ? settings.review_url || REVIEW_URL : '')
  const reviewLine = reviewUrl ? `রিভিউ ভিডিও: ${reviewUrl}\n` : ''

  const message =
    `আসসালামু আলাইকুম, আমি এই প্রোডাক্টটি অর্ডার করতে চাই:\n\n` +
    `প্রোডাক্ট: ${product.name}\n` +
    `মূল্য: ${formatPrice(effectivePrice(product))}\n` +
    `লিংক: ${productUrl}\n` +
    reviewLine +
    `\nদয়া করে অর্ডার কনফার্ম করতে সাহায্য করুন।`

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
