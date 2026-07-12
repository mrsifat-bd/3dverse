import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BUSINESS } from '@/lib/config'
import SocialLinks from '@/components/SocialLinks'
import { FadeIn } from '@/components/Motion'

export const metadata = {
  title: 'About us',
  description: `About 3DVerse — a small 3D printing studio run by ${BUSINESS.owner} in ${BUSINESS.location}.`,
}

export default function AboutPage() {
  return (
    <div className="container py-14">
      <FadeIn className="mx-auto max-w-3xl">
        <span className="text-xs uppercase tracking-wide text-clay">About us</span>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink">
          Small studio, precise prints, made in {BUSINESS.location}.
        </h1>

        <div className="mt-8 space-y-5 text-base leading-relaxed text-stone">
          <p>{BUSINESS.description}</p>
          <p>
            {BUSINESS.name} is run by {BUSINESS.owner}. What started as a passion for 3D printing has
            grown into a small studio serving students, clinics, businesses and gift-givers across
            Bangladesh. Because everything is printed on demand, we can adjust size, colour and detail
            to suit each order — from a single custom keyring to a batch of anatomical study models.
          </p>
          <p>
            We keep things simple: browse the catalog, pick what you like, and place your order over
            WhatsApp. We&apos;ll confirm the details, lead time and delivery with you directly.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { k: 'On demand', v: 'Every item printed per order' },
            { k: 'Customisable', v: 'Size, colour and detail to order' },
            { k: 'Local', v: `Based in ${BUSINESS.location}` },
          ].map((s) => (
            <div key={s.k} className="rounded-2xl border border-line bg-paper p-6">
              <p className="font-display text-lg font-semibold text-ink">{s.k}</p>
              <p className="mt-1 text-sm text-stone">{s.v}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/shop" className="btn-primary">Browse products <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/contact" className="btn-ghost">Contact us</Link>
        </div>

        <div className="mt-10 border-t border-line pt-8">
          <p className="text-sm text-stone">Follow our work:</p>
          <SocialLinks className="mt-3" />
        </div>
      </FadeIn>
    </div>
  )
}
