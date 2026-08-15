'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Menu, X, User, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import ThemeToggle from './ThemeToggle'
import { useSettings } from './SettingsProvider'
import { useCart } from './CartProvider'
import { recordSearch } from '@/lib/analytics'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/category/medical-bone-models', label: 'Medical & Bone Models' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const settings = useSettings()
  const cart = useCart()

  function submitSearch(e) {
    e.preventDefault()
    const term = q.trim()
    if (term) recordSearch(term)
    router.push(`/shop?q=${encodeURIComponent(term)}`)
    setOpen(false)
  }

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 transition-transform duration-200 hover:opacity-90 active:scale-95" aria-label={`${settings.business_name} home`}>
          <Image src="/logo.png" alt={`${settings.business_name} logo`} width={40} height={44} priority className="h-9 w-auto dark:invert" />
          <span className="font-display text-xl font-semibold tracking-tight text-ink">{settings.business_name}</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative text-sm transition-all duration-200 hover:scale-110 hover:text-clay active:scale-95 after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-clay after:transition-all after:duration-300 hover:after:w-full',
                isActive(item.href) ? 'font-medium text-clay after:w-full' : 'text-ink/80'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <form onSubmit={submitSearch} className="hidden items-center lg:flex">
            <div className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-2">
              <Search className="h-5 w-5 text-stone" />
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
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-line text-ink transition-all hover:-translate-y-0.5 hover:border-clay/40 hover:text-clay active:scale-90"
          >
            <ShoppingBag className="h-5 w-5" />
            {cart?.count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-clay px-1 text-[10px] font-semibold text-paper">{cart.count}</span>
            )}
          </Link>
          <Link
            href="/account"
            aria-label="My account"
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink transition-all hover:-translate-y-0.5 hover:border-clay/40 hover:text-clay active:scale-90"
          >
            <User className="h-5 w-5" />
          </Link>
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink transition-all hover:border-clay/40 hover:text-clay active:scale-90 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="glass animate-float-in border-t border-line md:hidden">
          <div className="container space-y-1 py-3">
            <form onSubmit={submitSearch} className="mb-3 flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-2">
              <Search className="h-5 w-5 text-stone" />
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
                className={cn('block rounded-lg px-3 py-2 text-sm transition-all hover:bg-line/50 hover:pl-4 active:scale-[0.98]', isActive(item.href) ? 'bg-line/60 font-medium text-clay' : 'text-ink/80')}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink/80 transition-all hover:bg-line/50 hover:pl-4 active:scale-[0.98]"
            >
              <User className="h-4 w-4" /> My account
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
