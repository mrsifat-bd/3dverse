// Feature card for the 3D Skeleton Builder, shown at the top of the Bones
// category (server component, no client JS). Set prices come from the
// builder's catalogue (database), never typed here.
import Image from 'next/image'
import Link from '@/components/LocalizedLink'
import { ArrowRight, Rotate3d } from 'lucide-react'
import { getServerT } from '@/i18n/server'
import { formatPrice } from '@/lib/format'
import { getSkeletonCatalog } from '@/lib/skeleton/server'

export default async function BuilderFeatureCard({ lang }) {
  const t = getServerT(lang)
  const { catalog } = await getSkeletonCatalog()
  const price = (k) => catalog.bundles.find((b) => b.key === k && b.is_active !== false)?.price
  const half = price('half')
  const full = price('full')
  return (
    <section
      aria-labelledby="builder-feature-title"
      className="relative mb-8 overflow-hidden rounded-2xl border border-clay/40 bg-gradient-to-br from-clay/10 via-paper to-paper"
    >
      <div className="grid items-center gap-4 p-5 sm:grid-cols-[1fr_auto] sm:gap-8 sm:p-7">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-clay/15 px-2.5 py-1 text-xs font-medium text-clay">
            <Rotate3d className="h-3.5 w-3.5" aria-hidden="true" /> {t('category.builderBadge')}
          </span>
          <h2 id="builder-feature-title" className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl">
            {t('category.builderTitle')}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone">{t('category.builderText')}</p>
          {half && full ? (
            <p className="mt-2 text-sm font-medium text-ink">
              {t('category.builderSets', { half: formatPrice(half, lang), full: formatPrice(full, lang) })}
            </p>
          ) : null}
          <Link
            href="/skeleton-builder"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-clay px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-clay-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
          >
            {t('category.builderCta')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="relative mx-auto hidden h-44 w-[88px] shrink-0 sm:block md:h-52 md:w-[104px]" aria-hidden="true">
          <Image src="/models/skeleton-front.webp" alt="" fill sizes="104px" className="object-contain" />
        </div>
      </div>
    </section>
  )
}
