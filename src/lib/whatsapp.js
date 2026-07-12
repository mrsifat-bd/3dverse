import { BUSINESS, SITE_URL } from './config'
import { formatPrice } from './format'

// Builds a wa.me order link with a Bangla pre-filled message.
// Works on mobile (WhatsApp app) and desktop (WhatsApp Web) via wa.me routing.
export function buildWhatsappOrderUrl(product) {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : SITE_URL
  const productUrl = `${origin}/product/${product.slug}`

  const message =
    `আসসালামু আলাইকুম, আমি এই প্রোডাক্টটি অর্ডার করতে চাই:\n\n` +
    `প্রোডাক্ট: ${product.name}\n` +
    `মূল্য: ${formatPrice(product.price)}\n` +
    `লিংক: ${productUrl}\n\n` +
    `দয়া করে অর্ডার কনফার্ম করতে সাহায্য করুন।`

  return `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(message)}`
}
