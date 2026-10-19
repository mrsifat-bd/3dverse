import Link from '@/components/LocalizedLink'
import Image from 'next/image'
import {
  ArrowRight, Stethoscope, GraduationCap, Gift, Boxes,
  ClipboardCheck, PenTool, Printer, Sparkles, ShieldCheck, Truck,
  BadgeCheck, Crosshair, Lightbulb, Heart,
} from 'lucide-react'
import SocialLinks from '@/components/SocialLinks'
import { FadeIn } from '@/components/Motion'
import { getSettings } from '@/lib/settings'
import { getServerT, getContent } from '@/i18n/server'
import { alternatesFor } from '@/i18n/config'

export function generateMetadata({ params }) {
  const t = getServerT(params.lang)
  return { title: t('meta.aboutTitle'), description: t('meta.aboutDescription'), alternates: alternatesFor('/about', params.lang) }
}

// Icons only; every word comes from the dictionary (content/<lang>/about).
const WHAT_ICONS = [Stethoscope, GraduationCap, Gift, Boxes]
const PROCESS_ICONS = [ClipboardCheck, PenTool, Printer, Sparkles, ShieldCheck, Truck]
const VALUE_ICONS = [BadgeCheck, Crosshair, Lightbulb, PenTool, Heart]

// The people behind 3D Verse. To add a real photo later: upload it to
// /public/team/ and set `photo` to its path. Names are shown as written.
const TEAM = [
  { name: 'Maksudur Rahman Rahat', roleKey: 'md', initials: 'MR', photo: '/team/rahat.jpg' },
  { name: 'Dr. M R Sifat', roleKey: 'cofounder', initials: 'MS', photo: '/team/sifat.jpg' },
  { name: 'Mahbubur Rahman', roleKey: 'advisor', initials: 'MR', photo: '/team/mahbubur.jpg' },
]

export default async function AboutPage({ params }) {
  const { lang } = params
  const t = getServerT(lang)
  const c = getContent(lang, 'about')
  const settings = await getSettings()

  return (
    <div className="container py-14">
      {/* Intro / story */}
      <FadeIn onLoad className="mx-auto max-w-3xl">
        <span className="text-xs uppercase tracking-wide text-clay">{c.eyebrow}</span>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">{c.title}</h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-stone">
          <p>{lang === 'bn' ? c.lead : settings.description}</p>
          {c.story.map((p) => <p key={p.slice(0, 24)}>{p.replace('{name}', settings.business_name)}</p>)}
        </div>
      </FadeIn>

      {/* What we do */}
      <section className="mx-auto mt-16 max-w-5xl">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-semibold text-ink">{c.whatTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone">{c.whatText}</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {c.what.map(({ title, body }, i) => {
            const Icon = WHAT_ICONS[i] || Boxes
            return (
              <div key={title} className="flex gap-4 rounded-2xl border border-line bg-paper p-6 transition duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-md hover:shadow-black/5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-clay/10 text-clay">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone">{body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* People behind 3D Verse */}
      <section className="mx-auto mt-16 max-w-5xl">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-semibold text-ink">{c.teamTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone">{c.teamText}</p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((m) => (
            <div key={m.name} className="overflow-hidden rounded-2xl border border-line bg-paper text-center transition duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-md hover:shadow-black/5">
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
                <h3 className="font-display text-lg font-semibold text-ink" lang="en">{m.name}</h3>
                <p className="mt-1 text-sm text-clay">{c.roles[m.roleKey]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our process */}
      <section className="mx-auto mt-16 max-w-5xl">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-semibold text-ink">{c.processTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone">{c.process.map((p) => p.title).join(' → ')}</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.process.map(({ title, body }, i) => {
            const Icon = PROCESS_ICONS[i] || Truck
            const n = String(i + 1).padStart(2, '0')
            return (
              <div key={n} className="relative rounded-2xl border border-line bg-paper p-6 transition duration-200 hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-md hover:shadow-black/5">
                <span aria-hidden="true" className="pointer-events-none absolute right-5 top-4 font-display text-3xl font-semibold text-line">{n}</span>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-clay/10 text-clay">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone">{body}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Brand values */}
      <section className="mx-auto mt-16 max-w-5xl rounded-3xl border border-line bg-paper p-8 sm:p-10">
        <h2 className="font-display text-2xl font-semibold text-ink">{c.valuesTitle}</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {c.values.map((label, i) => {
            const Icon = VALUE_ICONS[i] || Heart
            return (
              <span key={label} className="inline-flex items-center gap-2 rounded-full border border-line bg-cream px-4 py-2 text-sm font-medium text-ink">
                <Icon className="h-4 w-4 text-clay" /> {label}
              </span>
            )
          })}
        </div>
      </section>

      {/* Main office (the one place Sylhet is named on this page) + CTA */}
      <section className="mx-auto mt-16 max-w-3xl">
        <div className="rounded-3xl border border-line bg-ink p-8 text-paper sm:p-10">
          <h2 className="font-display text-2xl font-semibold">{c.officeTitle}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper/80">{c.officeText}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/shop" className="btn-primary">{t('cart.browse')} <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2.5 rounded-full border border-paper/30 px-6 py-3 text-sm font-medium text-paper transition duration-200 hover:-translate-y-0.5 hover:bg-paper/10 active:scale-[0.97]">{c.contactUs}</Link>
          </div>
        </div>

        <div className="mt-10">
          <p className="text-sm font-medium text-ink">{c.followTitle}</p>
          <p className="mt-1 text-sm text-stone">{c.followText}</p>
          <SocialLinks variant="solid" className="mt-4" />
        </div>
      </section>
    </div>
  )
}
