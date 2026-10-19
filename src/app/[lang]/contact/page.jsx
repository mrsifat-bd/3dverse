import Link from '@/components/LocalizedLink'
import { ArrowRight, Mail, MapPin, Box, Bone, Boxes, Lightbulb } from 'lucide-react'
import SocialLinks from '@/components/SocialLinks'
import ProductFaq from '@/components/ProductFaq'
import ContactInquiryForm from '@/components/ContactInquiryForm'
import { IconWhatsapp } from '@/components/icons'
import { getSettings } from '@/lib/settings'
import { getServerT, getContent } from '@/i18n/server'
import { seo } from '@/i18n/seo'

export function generateMetadata({ params }) {
  const t = getServerT(params.lang)
  return seo('/contact', params.lang, t('meta.contactTitle'), t('meta.contactDescription'))
}

const SERVICE_ICONS = [Box, Bone, Boxes, Lightbulb]

export default async function ContactPage({ params }) {
  const { lang } = params
  const t = getServerT(lang)
  const c = getContent(lang, 'contact')
  const s = await getSettings()
  const wa = (text) => `https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent(text)}`
  const mailto = `mailto:${s.email}`

  const direct = [
    { Icon: IconWhatsapp, label: 'WhatsApp', value: s.phone, desc: c.directWhatsapp, cta: c.directWhatsappCta, href: wa(c.waHello) },
    { Icon: Mail, label: c.email, value: s.email, desc: c.directEmail, cta: c.directEmailCta, href: mailto },
    { Icon: MapPin, label: c.office, value: s.location, desc: c.directOffice, cta: c.directOfficeCta, href: '#location' },
  ]

  return (
    <div>
      {/* 01 — HERO */}
      <section className="border-b border-line">
        <div className="container grid items-center gap-12 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-24">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">{c.eyebrow}</span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl">{c.title}</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-stone">{c.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={wa(c.waIdea)} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <IconWhatsapp className="h-4 w-4" /> {c.startWhatsapp}
              </a>
              <a href={mailto} className="btn-ghost"><Mail className="h-4 w-4" /> {c.sendEmail}</a>
            </div>
          </div>
          <div className="hidden justify-self-center md:block">
            <HeroCube />
          </div>
        </div>
      </section>

      {/* 02 — WHAT CAN WE HELP WITH */}
      <section className="container py-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold text-ink">{c.helpTitle}</h2>
          <p className="mt-3 text-base text-stone">{c.helpText}</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.services.map(({ title, desc, cta, wa: msg }, i) => {
            const Icon = SERVICE_ICONS[i] || Lightbulb
            return (
              <a
                key={title}
                href={wa(msg)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-2xl border border-line bg-paper p-6 transition duration-200 hover:-translate-y-1 hover:border-clay/40 hover:shadow-lg hover:shadow-black/5"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-clay/10 text-clay"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone">{desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-clay">
                  {cta} <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </a>
            )
          })}
        </div>
      </section>

      {/* 03 — DIRECT CONTACT */}
      <section className="border-y border-line bg-cream/40">
        <div className="container py-16">
          <h2 className="font-display text-3xl font-semibold text-ink">{c.directTitle}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {direct.map(({ Icon, label, value, desc, cta, href }) => {
              const external = href.startsWith('http')
              return (
                <div key={label} className="flex flex-col rounded-2xl border border-line bg-paper p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-clay/10 text-clay"><Icon className="h-5 w-5" /></span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone">{label}</span>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-ink">{value}</p>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-stone">{desc}</p>
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-medium text-clay hover:underline"
                  >
                    {cta} <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-line bg-paper p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone">{c.followTitle}</p>
              <p className="mt-1 text-sm text-stone">{c.followText}</p>
            </div>
            <SocialLinks variant="solid" />
          </div>
        </div>
      </section>

      {/* 04 — CUSTOM INQUIRY */}
      <section className="container py-16">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink">{c.formTitle}</h2>
            <p className="mt-3 text-base leading-relaxed text-stone">{c.formText}</p>
            <ul className="mt-6 space-y-3 text-sm text-stone">
              {c.formPoints.map((p) => (
                <li key={p} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" /> {p}</li>
              ))}
            </ul>
          </div>
          <ContactInquiryForm whatsappNumber={s.whatsapp_number} />
        </div>
      </section>

      {/* 05 — HOW IT WORKS */}
      <section className="border-y border-line bg-cream/40">
        <div className="container py-16">
          <h2 className="font-display text-3xl font-semibold text-ink">{c.processTitle}</h2>
          <ol className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-6">
            {c.process.map((p, i) => (
              <li key={p.title} className="relative">
                <div className="hidden lg:block">
                  {i < c.process.length - 1 && <span className="absolute left-8 top-3 h-px w-full bg-line" aria-hidden />}
                </div>
                <div className="relative flex items-center gap-3 lg:block">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-clay/40 bg-paper font-display text-xs font-bold text-clay lg:mb-4">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-stone">{p.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 06 — MAIN OFFICE (the one place Sylhet is named) */}
      <section id="location" className="container py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink">{c.officeTitle}</h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-stone">{c.officeText}</p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink">
              <MapPin className="h-4 w-4 text-clay" /> {s.location}
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line">
            <iframe
              title={c.mapTitle}
              className="h-56 w-full sm:h-64"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.openstreetmap.org/export/embed.html?bbox=91.80%2C24.86%2C91.95%2C24.94&layer=mapnik&marker=24.8949%2C91.8687"
            />
          </div>
        </div>
      </section>

      {/* 07 — FAQ */}
      <section className="container pb-4">
        <ProductFaq faqs={c.faqs} />
      </section>

      {/* FINAL CTA */}
      <section className="container py-16">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-ink px-6 py-14 text-center text-paper sm:px-12">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold sm:text-4xl">{c.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-paper/75">{c.ctaText}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={wa(c.waMake)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-clay px-6 py-3 text-sm font-medium text-paper transition duration-200 hover:-translate-y-0.5 hover:bg-clay-dark">
              <IconWhatsapp className="h-5 w-5" /> {c.ctaWhatsapp}
            </a>
            <Link href="/shop" className="inline-flex items-center justify-center gap-2 rounded-full border border-paper/25 px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-paper/10">
              {t('cart.browse')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

// Subtle abstract 3D form: an isometric cube built from print "layers".
function HeroCube() {
  const N = 7
  const layers = Array.from({ length: N + 1 }, (_, i) => i / N)
  return (
    <div className="float-slow">
      <svg viewBox="0 0 300 300" className="h-64 w-64 text-clay sm:h-80 sm:w-80" aria-hidden="true">
        {/* soft base shadow */}
        <ellipse cx="150" cy="272" rx="96" ry="14" className="fill-clay/10" />
        {/* left face print layers */}
        {layers.map((t, i) => (
          <line key={`l${i}`} x1="50" y1={95 + 110 * t} x2="150" y2={150 + 110 * t}
            className="stroke-clay" strokeOpacity={0.18} strokeWidth="1.5" />
        ))}
        {/* right face print layers */}
        {layers.map((t, i) => (
          <line key={`r${i}`} x1="150" y1={150 + 110 * t} x2="250" y2={95 + 110 * t}
            className="stroke-ink" strokeOpacity={0.14} strokeWidth="1.5" />
        ))}
        {/* top face (the part still being "printed" — dashed) */}
        <polygon points="150,40 250,95 150,150 50,95" className="fill-clay/5 stroke-clay" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="5 5" />
        {/* cube outline */}
        <g className="stroke-ink" strokeOpacity="0.85" strokeWidth="2" fill="none" strokeLinejoin="round">
          <polygon points="50,95 150,150 150,260 50,205" />
          <polygon points="150,150 250,95 250,205 150,260" />
        </g>
        {/* vertical print nozzle hint */}
        <line x1="150" y1="8" x2="150" y2="40" className="stroke-clay" strokeWidth="2" strokeLinecap="round" />
        <circle cx="150" cy="40" r="3" className="fill-clay" />
      </svg>
    </div>
  )
}
