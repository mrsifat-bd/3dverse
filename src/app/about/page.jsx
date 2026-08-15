import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Stethoscope, GraduationCap, Gift, Boxes,
  ClipboardCheck, PenTool, Printer, Sparkles, ShieldCheck, Truck,
  BadgeCheck, Crosshair, Lightbulb, Heart,
} from 'lucide-react'
import SocialLinks from '@/components/SocialLinks'
import { FadeIn } from '@/components/Motion'
import { getSettings } from '@/lib/settings'

export const metadata = {
  title: 'About us',
  description:
    'About 3D Verse — a 3D printing studio in Sylhet, Bangladesh focused on precise anatomical & educational models, personalised pieces and useful everyday prints.',
  alternates: { canonical: '/about' },
}

// What we make.
const WHAT_WE_DO = [
  { Icon: Stethoscope, title: 'Medical & anatomical models', body: 'Accurate skulls, bones, vertebrae and study sets for students and clinics.' },
  { Icon: GraduationCap, title: 'Educational products', body: 'Hands-on learning models and teaching aids that make concepts easier to grasp.' },
  { Icon: Gift, title: 'Personalised products', body: 'Thoughtful, made-to-order keepsakes and gifts for people and occasions.' },
  { Icon: Boxes, title: 'Everyday useful prints', body: 'Practical home, desk and utility pieces designed to be genuinely useful.' },
]

// The people behind 3D Verse. To add a real photo later: upload it to
// /public/team/ and set `photo` to its path (e.g. '/team/rahat.jpg').
// Until then a clean branded initials placeholder is shown.
const TEAM = [
  { name: 'Maksudur Rahman Rahat', role: 'Co-Founder & Managing Director', initials: 'MR', photo: '/team/rahat.jpg' },
  { name: 'Dr. M R Sifat', role: 'Co-Founder', initials: 'MS', photo: '/team/sifat.jpg' },
  { name: 'Mahbubur Rahman', role: 'Chief Advisor', initials: 'MR', photo: '/team/mahbubur.jpg' },
]

const PROCESS = [
  { n: '01', Icon: ClipboardCheck, title: 'Order Confirmation', body: 'We confirm your order and finalise the required details.' },
  { n: '02', Icon: PenTool, title: '3D Design', body: 'Our designers prepare or refine the required design.' },
  { n: '03', Icon: Printer, title: 'Production', body: 'The finalised design goes into 3D printing and production.' },
  { n: '04', Icon: Sparkles, title: 'Post-Processing', body: 'The printed piece receives the necessary finishing.' },
  { n: '05', Icon: ShieldCheck, title: 'Quality Check', body: 'Every finished product is checked before dispatch.' },
  { n: '06', Icon: Truck, title: 'Delivery', body: 'The product is carefully prepared and sent for delivery.' },
]

const VALUES = [
  { Icon: BadgeCheck, label: 'Quality' },
  { Icon: Crosshair, label: 'Precision' },
  { Icon: Lightbulb, label: 'Innovation' },
  { Icon: PenTool, label: 'Thoughtful Design' },
  { Icon: Heart, label: 'Customer Satisfaction' },
]

export default async function AboutPage() {
  const settings = await getSettings()

  return (
    <div className="container py-14">
      {/* Intro / story */}
      <FadeIn className="mx-auto max-w-3xl">
        <span className="text-xs uppercase tracking-wide text-clay">About us</span>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          Precise, well-designed 3D printing — made in {settings.location}.
        </h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-stone">
          <p>{settings.description}</p>
          <p>
            {settings.business_name} is a 3D printing studio built around a simple idea: turn digital
            designs into physical products that are accurate, well-finished and genuinely useful. From
            our studio in {settings.location}, we design and print for students, clinics, educators,
            businesses and gift-givers across Bangladesh.
          </p>
          <p>
            We care about the details that matter — clean geometry, precise dimensions, and a proper
            finish on every piece. Ordering is simple: browse the catalog, pick what you like, and
            place your order over WhatsApp. We confirm the details, lead time and delivery with you
            directly.
          </p>
        </div>
      </FadeIn>

      {/* What we do */}
      <section className="mx-auto mt-16 max-w-5xl">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-semibold text-ink">What we do</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone">
            A focus on quality, precision and design across everything we print.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {WHAT_WE_DO.map(({ Icon, title, body }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-line bg-paper p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-md hover:shadow-black/5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-clay/10 text-clay">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* People behind 3D Verse */}
      <section className="mx-auto mt-16 max-w-5xl">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-semibold text-ink">People behind 3D Verse</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone">The team designing, printing and standing behind every order.</p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((m) => (
            <div key={m.name} className="overflow-hidden rounded-2xl border border-line bg-paper text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-md hover:shadow-black/5">
              {/* Photo slot — replace by setting `photo` in the TEAM array above. */}
              <div className="relative aspect-square w-full bg-cream">
                {m.photo ? (
                  <Image src={m.photo} alt={m.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <span className="grid h-20 w-20 place-items-center rounded-full border border-clay/30 bg-clay/10 font-display text-2xl font-semibold text-clay">
                      {m.initials}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-semibold text-ink">{m.name}</h3>
                <p className="mt-1 text-sm text-clay">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our process */}
      <section className="mx-auto mt-16 max-w-5xl">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-semibold text-ink">How we work</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone">
            Order Confirmation → 3D Design → Production → Post-Processing → Quality Check → Delivery
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROCESS.map(({ n, Icon, title, body }) => (
            <div key={n} className="relative rounded-2xl border border-line bg-paper p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-md hover:shadow-black/5">
              <span className="pointer-events-none absolute right-5 top-4 font-display text-3xl font-semibold text-line">{n}</span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-clay/10 text-clay">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-stone">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Brand values */}
      <section className="mx-auto mt-16 max-w-5xl rounded-3xl border border-line bg-paper p-8 sm:p-10">
        <h2 className="font-display text-2xl font-semibold text-ink">What we care about</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {VALUES.map(({ Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-2 rounded-full border border-line bg-cream px-4 py-2 text-sm font-medium text-ink">
              <Icon className="h-4 w-4 text-clay" /> {label}
            </span>
          ))}
        </div>
      </section>

      {/* Location + follow + CTA */}
      <section className="mx-auto mt-16 max-w-3xl">
        <div className="rounded-3xl border border-line bg-ink p-8 text-paper sm:p-10">
          <h2 className="font-display text-2xl font-semibold">Based in {settings.location}, serving all of Bangladesh</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper/80">
            We design and print locally in {settings.location} and deliver to customers across the
            country. Have an idea or a question? We&apos;re one message away.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/shop" className="btn-primary">Browse products <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2.5 rounded-full border border-paper/30 px-6 py-3 text-sm font-medium text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-paper/10 active:scale-[0.97]">Contact us</Link>
          </div>
        </div>

        <div className="mt-10">
          <p className="text-sm font-medium text-ink">Follow our work</p>
          <p className="mt-1 text-sm text-stone">See new prints, restocks and behind-the-scenes.</p>
          <SocialLinks variant="solid" className="mt-4" />
        </div>
      </section>
    </div>
  )
}
