import { Suspense } from 'react'
import TrackOrder from '@/components/TrackOrder'
import { getServerT } from '@/i18n/server'
import { seo } from '@/i18n/seo'

export async function generateMetadata(props) {
  const params = await props.params;
  const t = getServerT(params.lang)
  return seo('/track', params.lang, t('meta.trackTitle'), t('meta.trackDescription'))
}

export default async function TrackPage(props) {
  const params = await props.params;
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
