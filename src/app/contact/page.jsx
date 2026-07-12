import { Mail, MapPin } from 'lucide-react'
import { BUSINESS } from '@/lib/config'
import SocialLinks from '@/components/SocialLinks'
import { IconWhatsapp } from '@/components/icons'

export const metadata = {
  title: 'Contact',
  description: 'Get in touch with 3DVerse — order on WhatsApp, email, or find us in Sylhet, Bangladesh.',
}

export default function ContactPage() {
  const rows = [
    { Icon: IconWhatsapp, label: 'WhatsApp', value: BUSINESS.phone, href: `https://wa.me/${BUSINESS.whatsappNumber}` },
    { Icon: Mail, label: 'Email', value: BUSINESS.email, href: `mailto:${BUSINESS.email}` },
    { Icon: MapPin, label: 'Location', value: BUSINESS.location, href: null },
  ]

  return (
    <div className="container py-14">
      <div className="mx-auto max-w-4xl">
        <span className="text-xs uppercase tracking-wide text-clay">Contact</span>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink">Get in touch</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-stone">
          Have a question, a custom idea, or a bulk order? Message us on WhatsApp for the fastest
          response — we&apos;re happy to help with sizing, colours and lead times.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            {rows.map(({ Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4 rounded-2xl border border-line bg-paper p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-clay/10 text-clay"><Icon className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-stone">{label}</p>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-ink hover:text-clay">{value}</a>
                  ) : (
                    <p className="text-sm font-medium text-ink">{value}</p>
                  )}
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-line bg-paper p-5">
              <p className="text-xs uppercase tracking-wide text-stone">Follow us</p>
              <SocialLinks className="mt-3" />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-line bg-ink p-8 text-paper">
            <div>
              <h2 className="font-display text-2xl font-semibold">Order on WhatsApp</h2>
              <p className="mt-3 text-sm leading-relaxed text-paper/80">
                Tap below to start a chat. Tell us which product you&apos;d like, and we&apos;ll confirm
                your order, price and delivery.
              </p>
            </div>
            <a href={`https://wa.me/${BUSINESS.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-clay px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-clay-dark">
              <IconWhatsapp className="h-5 w-5" /> Message {BUSINESS.name}
            </a>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-line">
          <iframe
            title="3DVerse location — Sylhet, Bangladesh"
            className="h-72 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.openstreetmap.org/export/embed.html?bbox=91.80%2C24.86%2C91.95%2C24.94&layer=mapnik&marker=24.8949%2C91.8687"
          />
        </div>
      </div>
    </div>
  )
}
