'use client'
import { buildWhatsappOrderUrl } from '@/lib/whatsapp'
import { IconWhatsapp } from './icons'
import { cn } from '@/lib/utils'

// "Buy Now on WhatsApp" — opens wa.me with the Bangla pre-filled order message.
export default function BuyButton({ product, full = false, className }) {
  const url = buildWhatsappOrderUrl(product)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full bg-clay px-6 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-clay-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        full && 'w-full',
        className
      )}
    >
      <IconWhatsapp className="h-5 w-5" />
      Buy Now on WhatsApp
    </a>
  )
}
