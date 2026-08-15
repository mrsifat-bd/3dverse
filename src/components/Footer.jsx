'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, MapPin } from 'lucide-react'
import SocialLinks from './SocialLinks'
import SubscribeForm from './SubscribeForm'
import { IconWhatsapp } from './icons'
import { useSettings } from './SettingsProvider'

export default function Footer({ categories = [] }) {
  const s = useSettings()
  return (
    <footer className="mt-24 border-t border-line bg-paper">
      <div className="border-b border-line">
        <div className="container flex flex-col items-start justify-between gap-5 py-10 md:flex-row md:items-center">
          <div>
            <h3 className="font-display text-xl font-semibold text-ink">Get new drops &amp; offers</h3>
            <p className="mt-1 text-sm text-stone">Subscribe with your email — new prints, restocks and discounts. No spam.</p>
          </div>
          <div className="w-full md:max-w-md">
            <SubscribeForm source="footer" />
          </div>
        </div>
      </div>
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt={`${s.business_name} logo`} width={40} height={44} className="h-9 w-auto dark:invert" />
            <span className="font-display text-xl font-semibold text-ink">{s.business_name}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone">{s.tagline}</p>
          <p className="mt-6 text-sm font-medium text-ink">Follow us</p>
          <SocialLinks variant="solid" className="mt-3" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-ink">Shop</h3>
          <ul className="mt-4 space-y-2 text-sm text-stone">
            <li><Link href="/shop" className="hover:text-clay">All products</Link></li>
            {categories.map((c) => (
              <li key={c.slug}><Link href={`/category/${c.slug}`} className="hover:text-clay">{c.name}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium text-ink">Company</h3>
          <ul className="mt-4 space-y-2 text-sm text-stone">
            <li><Link href="/about" className="hover:text-clay">About us</Link></li>
            <li><Link href="/contact" className="hover:text-clay">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium text-ink">Get in touch</h3>
          <ul className="mt-4 space-y-3 text-sm text-stone">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clay" /><span>{s.location}</span></li>
            <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-clay" /><a href={`mailto:${s.email}`} className="hover:text-clay">{s.email}</a></li>
            <li className="flex items-start gap-2"><IconWhatsapp className="mt-0.5 h-4 w-4 shrink-0 text-clay" /><a href={`https://wa.me/${s.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="hover:text-clay">{s.phone}</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-stone sm:flex-row">
          <p>© {new Date().getFullYear()} {s.business_name}. All rights reserved.</p>
          <p>Owner: {s.owner} · {s.location}</p>
        </div>
        <div className="container pb-5 text-center text-[11px] leading-relaxed text-stone/80">
          To process orders we record basic, non-personal info (approximate city/country, device type and browser) when you view a product or start a WhatsApp order.
        </div>
      </div>
    </footer>
  )
}
