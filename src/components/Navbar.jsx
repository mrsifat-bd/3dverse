'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Menu, X } from 'lucide-react'
import { BUSINESS } from '@/lib/config'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/category/bone-models', label: 'Bone Models' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const pathname = usePathname()
  const router = useRouter()

  function submitSearch(e) {
    e.preventDefault()
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`)
    setOpen(false)
  }

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/85 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" aria-label={`${BUSINESS.name} home`}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink font-display text-lg font-bold text-clay">3D</span>
          <span className="font-display text-xl font-semibold tracking-tight text-ink">{BUSINESS.name}</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn('text-sm transition-colors hover:text-clay', isActive(item.href) ? 'font-medium text-clay' : 'text-ink/80')}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <form onSubmit={submitSearch} className="hidden items-center lg:flex">
            <div className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-2">
              <Search className="h-4 w-4 text-stone" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="search"
                placeholder="Search products…"
                aria-label="Search products"
                className="w-40 bg-transparent text-sm text-ink placeholder:text-stone focus:outline-none"
              />
            </div>
          </form>
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-cream md:hidden">
          <div className="container space-y-1 py-3">
            <form onSubmit={submitSearch} className="mb-3 flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-2">
              <Search className="h-4 w-4 text-stone" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="search"
                placeholder="Search products…"
                aria-label="Search products"
                className="w-full bg-transparent text-sm text-ink placeholder:text-stone focus:outline-none"
              />
            </form>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn('block rounded-lg px-3 py-2 text-sm', isActive(item.href) ? 'bg-line/60 font-medium text-clay' : 'text-ink/80')}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
