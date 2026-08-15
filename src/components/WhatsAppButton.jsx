'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { IconWhatsapp } from './icons'
import { useSettings } from './SettingsProvider'
import { BUSINESS } from '@/lib/config'

// Floating WhatsApp chat button — appears after the first scroll.
export default function WhatsAppButton() {
  const s = useSettings()
  const [show, setShow] = useState(false)
  const number = s.whatsapp_number || BUSINESS.whatsappNumber

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={cn(
        'group fixed bottom-6 left-6 z-50 flex items-center rounded-full bg-[#25D366] p-3 text-sm font-medium text-white shadow-lg shadow-[#25D366]/30 transition-all duration-300 hover:-translate-y-1 active:scale-95',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      )}
    >
      <IconWhatsapp className="h-6 w-6 shrink-0" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[130px] group-hover:opacity-100">
        WhatsApp us
      </span>
    </a>
  )
}
