import PolicyPage from '@/components/PolicyPage'
import { getServerT } from '@/i18n/server'
import { seo } from '@/i18n/seo'

export function generateMetadata({ params }) {
  const t = getServerT(params.lang)
  return seo('/refund-policy', params.lang, t('meta.refundTitle'), t('meta.refundDescription'))
}

export default function RefundPolicy({ params }) {
  return <PolicyPage lang={params.lang} doc="refund" />
}
