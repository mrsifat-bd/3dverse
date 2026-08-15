import Link from 'next/link'
import { ArrowRight, Mail, MapPin, Box, Bone, Boxes, Lightbulb } from 'lucide-react'
import SocialLinks from '@/components/SocialLinks'
import ProductFaq from '@/components/ProductFaq'
import ContactInquiryForm from '@/components/ContactInquiryForm'
import { IconWhatsapp } from '@/components/icons'
import { getSettings } from '@/lib/settings'

export const metadata = {
  title: 'Contact 3D Verse | 3D Printing & Custom Manufacturing in Bangladesh',
  description:
    'Contact 3D Verse for custom 3D printing, medical and anatomical models, personalised products, bulk orders and custom design services from Sylhet, Bangladesh.',
  alternates: { canonical: '/contact' },
}

const FAQS = [
  { q: 'How do I place a custom order?', a: "Send us your idea, reference or requirements through WhatsApp. We'll discuss the design, material, size, pricing and lead time with you." },
  { q: 'Can you print a model I already have?', a: 'If you have a 3D model, send it to us so we can check whether it is suitable for printing.' },
  { q: 'Can you create the 3D model for me?', a: 'For custom projects, our design team can prepare or refine the required 3D design depending on the project.' },
  { q: 'Do you accept bulk orders?', a: 'Yes. Contact us with the required quantity and project details so we can discuss pricing and production.' },
  { q: 'Do you deliver outside Sylhet?', a: 'Yes. 3D Verse is based in Sylhet and serves customers across Bangladesh.' },
  { q: "What's the fastest way to contact you?", a: 'WhatsApp is the fastest way to discuss an order or custom project.' },
]

const PROCESS = [
  { n: '01', t: 'Order Confirmation', d: 'We confirm your requirements and finalise the details.' },
  { n: '02', t: '3D Design', d: 'Our designers prepare or refine the required design.' },
  { n: '03', t: 'Production', d: 'The finalised design goes into 3D printing and production.' },
  { n: '04', t: 'Post-Processing', d: 'Each printed piece receives the finishing it needs.' },
  { n: '05', t: 'Quality Check', d: 'Every finished product is checked before dispatch.' },
  { n: '06', t: 'Delivery', d: 'The completed piece is carefully prepared and sent for delivery.' },
]

export default async function ContactPage() {
  const s = await getSettings()
  const wa = (text) => `https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent(text)}`
  const mailto = `mailto:${s.email}`

  const services = [
    { Icon: Box, title: 'Custom 3D Printing', desc: "Have a model, idea or reference? Let's turn it into a physical piece.", cta: 'Start a custom order', href: wa('Hello 3D Verse, I would like to start a custom 3D printing order.') },
    { Icon: Bone, title: 'Medical & Anatomy', desc: 'Anatomical models, bones, vertebrae and study pieces for students and clinics.', cta: 'Ask about models', href: wa('Hello 3D Verse, I would like to ask about your medical / anatomical models.') },
    { Icon: Boxes, title: 'Bulk & Business', desc: 'Need multiple pieces for a business, event, institution or project?', cta: 'Discuss a bulk order', href: wa('Hello 3D Verse, I would like to discuss a bulk / business order.') },
    { Icon: Lightbulb, title: 'Something Else', desc: "Not sure which category fits? Tell us what you're trying to make.", cta: 'Talk to us', href: wa("Hello 3D Verse, I have an idea I'd like to make — can you help?") },
  ]

  const direct = [
    { Icon: IconWhatsapp, label: 'WhatsApp', value: s.phone, desc: 'Fastest way to discuss an order or custom idea.', cta: 'Message us', href: wa('Hello 3D Verse,') },
    { Icon: Mail, label: 'Email', value: s.email, desc: 'For detailed inquiries, business communication and collaboration.', cta: 'Send email', href: mailto },
    { Icon: MapPin, label: 'Studio', value: s.location, desc: 'Designed and printed locally. Delivered across Bangladesh.', cta: 'View location', href: '#location' },
  ]

  return (
    <div>
      {/* 01 — HERO */}
      <section className="border-b border-line">
        <div className="container grid items-center gap-12 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-24">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Contact / 3D Verse</span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl">
              Have an idea? Let&apos;s make it real.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-stone">
              Whether it&apos;s a custom print, an anatomical model, a bulk order or an idea you&apos;re still
              figuring out, tell us what you need. We&apos;ll help you take it from concept to finished piece.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={wa('Hello 3D Verse, I have an idea I would like to make.')} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <IconWhatsapp className="h-4 w-4" /> Start on WhatsApp
              </a>
              <a href={mailto} className="btn-ghost"><Mail className="h-4 w-4" /> Send an Email</a>
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
          <h2 className="font-display text-3xl font-semibold text-ink">What can we help you make?</h2>
          <p className="mt-3 text-base text-stone">Choose what you&apos;re looking for and we&apos;ll take it from there.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ Icon, title, desc, cta, href }) => (
            <a
              key={title}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col rounded-2xl border border-line bg-paper p-6 transition-all duration-200 hover:-translate-y-1 hover:border-clay/40 hover:shadow-lg hover:shadow-black/5"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-clay/10 text-clay"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-stone">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-clay">
                {cta} <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* 03 — DIRECT CONTACT */}
      <section className="border-y border-line bg-cream/40">
        <div className="container py-16">
          <h2 className="font-display text-3xl font-semibold text-ink">Prefer a direct conversation?</h2>
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
              <p className="text-xs font-semibold uppercase tracking-wider text-stone">Follow 3D Verse</p>
              <p className="mt-1 text-sm text-stone">New prints, restocks and behind-the-scenes.</p>
            </div>
            <SocialLinks variant="solid" />
          </div>
        </div>
      </section>

      {/* 04 — CUSTOM INQUIRY */}
      <section className="container py-16">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink">Tell us what you&apos;re working on.</h2>
            <p className="mt-3 text-base leading-relaxed text-stone">
              Send us a few details and we&apos;ll help you figure out the next step. The form opens WhatsApp
              with everything filled in — just press send.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-stone">
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" /> Custom prints, designs, medical models and bulk orders.</li>
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" /> Share size, colour, quantity and a reference.</li>
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" /> We reply with design, pricing and lead time.</li>
            </ul>
          </div>
          <ContactInquiryForm whatsappNumber={s.whatsapp_number} />
        </div>
      </section>

      {/* 05 — HOW IT WORKS */}
      <section className="border-y border-line bg-cream/40">
        <div className="container py-16">
          <h2 className="font-display text-3xl font-semibold text-ink">From idea to finished piece.</h2>
          <ol className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-6">
            {PROCESS.map((p, i) => (
              <li key={p.n} className="relative">
                <div className="hidden lg:block">
                  {i < PROCESS.length - 1 && <span className="absolute left-8 top-3 h-px w-full bg-line" aria-hidden />}
                </div>
                <div className="relative flex items-center gap-3 lg:block">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-clay/40 bg-paper font-display text-xs font-bold text-clay lg:mb-4">{p.n}</span>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">{p.t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-stone">{p.d}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 06 — LOCATION */}
      <section id="location" className="container py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink">Made in Sylhet.</h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-stone">
              Our studio is based in Sylhet, Bangladesh. We design and print locally and deliver to customers
              across Bangladesh.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink">
              <MapPin className="h-4 w-4 text-clay" /> {s.location}
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line">
            <iframe
              title="3D Verse location — Sylhet, Bangladesh"
              className="h-56 w-full sm:h-64"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.openstreetmap.org/export/embed.html?bbox=91.80%2C24.86%2C91.95%2C24.94&layer=mapnik&marker=24.8949%2C91.8687"
            />
          </div>
        </div>
      </section>

      {/* 07 — FAQ (reuses the existing ProductFaq accordion) */}
      <section className="container pb-4">
        <ProductFaq faqs={FAQS} />
      </section>

      {/* FINAL CTA */}
      <section className="container py-16">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-ink px-6 py-14 text-center text-paper sm:px-12">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold sm:text-4xl">Let&apos;s turn your idea into something real.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-paper/75">
            Have a product in mind? Send us a message and let&apos;s figure it out together.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={wa('Hello 3D Verse, I would like to make something.')} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-clay px-6 py-3 text-sm font-medium text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-clay-dark">
              <IconWhatsapp className="h-5 w-5" /> Message 3D Verse on WhatsApp
            </a>
            <Link href="/shop" className="inline-flex items-center justify-center gap-2 rounded-full border border-paper/25 px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-paper/10">
              Browse Products <ArrowRight className="h-4 w-4" />
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
      <svg viewBox="0 0 300 300" className="h-64 w-64 text-clay sm:h-80 sm:w-80" role="img" aria-label="Abstract layered 3D-printed cube">
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
