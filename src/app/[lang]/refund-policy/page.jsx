import PolicyPage from '@/components/PolicyPage'
import { getServerT } from '@/i18n/server'
import { alternatesFor } from '@/i18n/config'

export function generateMetadata({ params }) {
  const t = getServerT(params.lang)
  return { title: t('meta.refundTitle'), description: t('meta.refundDescription'), alternates: alternatesFor('/refund-policy', params.lang) }
}

export default function RefundPolicy({ params }) {
  return <PolicyPage lang={params.lang} doc="refund" />
}
