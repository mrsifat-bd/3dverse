import { Suspense } from 'react'
import TrackOrder from '@/components/TrackOrder'
import { getServerT } from '@/i18n/server'
import { alternatesFor } from '@/i18n/config'

export function generateMetadata({ params }) {
  const t = getServerT(params.lang)
  return {
    title: t('meta.trackTitle'),
    description: t('meta.trackDescription'),
    alternates: alternatesFor('/track', params.lang),
  }
}

export default function TrackPage({ params }) {
  const t = getServerT(params.lang)
  return (
    <div className="container max-w-xl py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">{t('track.title')}</h1>
      <p className="mt-2 text-sm text-stone">{t('track.intro')}</p>
      <Suspense fallback={null}>
        <TrackOrder />
      </Suspense>
    </div>
  )
}
