import Link from 'next/link'
import { Mail, MapPin } from 'lucide-react'
import { BUSINESS, CATEGORIES } from '@/lib/config'
import SocialLinks from './SocialLinks'
import { IconWhatsapp } from './icons'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-paper">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink font-display text-lg font-bold text-clay">3D</span>
            <span className="font-display text-xl font-semibold text-ink">{BUSINESS.name}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone">{BUSINESS.tagline}</p>
          <SocialLinks className="mt-5" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-ink">Shop</h3>
          <ul className="mt-4 space-y-2 text-sm text-stone">
            <li><Link href="/shop" className="hover:text-clay">All products</Link></li>
            {CATEGORIES.map((c) => (
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
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clay" /><span>{BUSINESS.location}</span></li>
            <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-clay" /><a href={`mailto:${BUSINESS.email}`} className="hover:text-clay">{BUSINESS.email}</a></li>
            <li className="flex items-start gap-2"><IconWhatsapp className="mt-0.5 h-4 w-4 shrink-0 text-clay" /><a href={`https://wa.me/${BUSINESS.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-clay">{BUSINESS.phone}</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-stone sm:flex-row">
          <p>© {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.</p>
          <p>Owner: {BUSINESS.owner} · {BUSINESS.location}</p>
        </div>
      </div>
    </footer>
  )
}
