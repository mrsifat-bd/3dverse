'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// Opens a Messenger chat with the 3DVerse Facebook page.
const MESSENGER_URL = 'https://m.me/3dversebd'

export default function MessengerButton() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <a
      href={MESSENGER_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message us on Messenger"
      className={cn(
        'group fixed bottom-6 left-6 z-50 flex items-center gap-0 rounded-full bg-[#0084FF] py-3 pl-3 pr-3 text-sm font-medium text-white shadow-lg shadow-[#0084FF]/30 transition-all duration-300 hover:-translate-y-1 hover:pr-4 active:scale-95',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      )}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.9 1.19 5.44 3.14 7.17.16.14.26.35.27.57l.05 1.78c.02.57.61.94 1.13.71l1.98-.87c.17-.08.36-.09.54-.05.91.25 1.88.39 2.79.39 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2Zm6.02 7.46-2.94 4.66c-.46.74-1.46.93-2.17.41l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66c.46-.74 1.46-.93 2.17-.41l2.34 1.75c.21.16.51.16.72 0l3.16-2.4c.42-.32.97.18.69.63Z" />
      </svg>
      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[130px] group-hover:opacity-100">
        Message us
      </span>
    </a>
  )
}
