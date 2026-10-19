'use client'
import Link from './LocalizedLink'
import Image from 'next/image'
import { Mail, Truck } from 'lucide-react'
import SocialLinks from './SocialLinks'
import SubscribeForm from './SubscribeForm'
import { IconWhatsapp } from './icons'
import { useSettings } from './SettingsProvider'
import { useLang, useT } from '@/i18n/client'
import { localized } from '@/lib/format'

export default function Footer({ categories = [] }) {
  const s = useSettings()
  const lang = useLang()
  const t = useT()
  return (
    <footer className="mt-24 border-t border-line bg-paper">
      <div className="border-b border-line">
        <div className="container flex flex-col items-start justify-between gap-5 py-10 md:flex-row md:items-center">
          <div>
            <h3 className="font-display text-xl font-semibold text-ink">{t('footer.newsletterTitle')}</h3>
            <p className="mt-1 text-sm text-stone">{t('footer.newsletterText')}</p>
          </div>
          <div className="w-full md:max-w-md">
            <SubscribeForm source="footer" />
          </div>
        </div>
      </div>
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Image src="/logo-sm.webp" alt={t('common.logoAlt', { name: s.business_name })} width={40} height={44} className="h-9 w-auto dark:invert" />
            <span className="font-display text-xl font-semibold text-ink">{s.business_name}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone">{localized(s, 'tagline', lang)}</p>
          <p className="mt-6 text-sm font-medium text-ink">{t('footer.followUs')}</p>
          <SocialLinks variant="solid" className="mt-3" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-ink">{t('footer.shop')}</h3>
          <ul className="mt-4 space-y-2 text-sm text-stone">
            <li><Link href="/shop" className="hover:text-clay">{t('footer.allProducts')}</Link></li>
            {categories.map((c) => (
              <li key={c.slug}><Link href={`/category/${c.slug}`} className="hover:text-clay">{localized(c, 'name', lang)}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium text-ink">{t('footer.company')}</h3>
          <ul className="mt-4 space-y-2 text-sm text-stone">
            <li><Link href="/about" className="hover:text-clay">{t('footer.about')}</Link></li>
            <li><Link href="/contact" className="hover:text-clay">{t('footer.contact')}</Link></li>
          </ul>
          <h3 className="mt-8 text-sm font-medium text-ink">{t('footer.help')}</h3>
          <ul className="mt-4 space-y-2 text-sm text-stone">
            <li><Link href="/track" className="hover:text-clay">{t('footer.track')}</Link></li>
            <li><Link href="/faq" className="hover:text-clay">{t('footer.faq')}</Link></li>
            <li><Link href="/shipping-policy" className="hover:text-clay">{t('footer.shipping')}</Link></li>
            <li><Link href="/refund-policy" className="hover:text-clay">{t('footer.refunds')}</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-clay">{t('footer.privacy')}</Link></li>
            <li><Link href="/terms" className="hover:text-clay">{t('footer.terms')}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium text-ink">{t('footer.getInTouch')}</h3>
          <ul className="mt-4 space-y-3 text-sm text-stone">
            <li className="flex items-start gap-2"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-clay" /><span>{t('footer.serving')}</span></li>
            <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-clay" /><a href={`mailto:${s.email}`} className="hover:text-clay">{s.email}</a></li>
            <li className="flex items-start gap-2"><IconWhatsapp className="mt-0.5 h-4 w-4 shrink-0 text-clay" /><a href={`https://wa.me/${s.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="hover:text-clay">{s.phone}</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-stone sm:flex-row">
          <p>{t('footer.copyright', { year: new Date().getFullYear(), name: s.business_name })}</p>
          <p>{t('footer.owner', { owner: s.owner })}</p>
        </div>
        <div className="container pb-5 text-center text-[11px] leading-relaxed text-stone/80">
          {t('footer.privacyNote')}
        </div>
      </div>
    </footer>
  )
}
