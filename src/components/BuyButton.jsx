'use client'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { buildWhatsappOrderUrl } from '@/lib/whatsapp'
import { recordLead } from '@/lib/leads'
import { IconWhatsapp } from './icons'
import { cn } from '@/lib/utils'
import { useSettings } from './SettingsProvider'

// "Buy Now on WhatsApp" — opens wa.me with the Bangla pre-filled order message,
// records an 'order' lead, and briefly acknowledges the tap before the redirect.
export default function BuyButton({ product, full = false, className }) {
  const settings = useSettings()
  const url = buildWhatsappOrderUrl(product, settings)
  const [opening, setOpening] = useState(false)

  function handleClick() {
    recordLead({ action: 'order', product })
    setOpening(true)
    setTimeout(() => setOpening(false), 1600)
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center gap-2.5 rounded-full bg-clay px-6 py-3 text-sm font-medium text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-clay-dark hover:shadow-lg hover:shadow-clay/20 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        full && 'w-full',
        className
      )}
    >
      {opening ? (
        <>
          <Check className="h-5 w-5 shrink-0" /> Opening WhatsApp…
        </>
      ) : (
        <>
          <IconWhatsapp className="h-5 w-5 shrink-0" /> Buy Now on WhatsApp
        </>
      )}
    </a>
  )
}
