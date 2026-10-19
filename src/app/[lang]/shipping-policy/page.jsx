import PolicyPage from '@/components/PolicyPage'
import { getServerT } from '@/i18n/server'
import { alternatesFor } from '@/i18n/config'

export function generateMetadata({ params }) {
  const t = getServerT(params.lang)
  return { title: t('meta.shippingTitle'), description: t('meta.shippingDescription'), alternates: alternatesFor('/shipping-policy', params.lang) }
}

export default function ShippingPolicy({ params }) {
  return <PolicyPage lang={params.lang} doc="shipping" />
}
