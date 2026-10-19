import PolicyPage from '@/components/PolicyPage'
import { getServerT } from '@/i18n/server'
import { seo } from '@/i18n/seo'

export function generateMetadata({ params }) {
  const t = getServerT(params.lang)
  return seo('/shipping-policy', params.lang, t('meta.shippingTitle'), t('meta.shippingDescription'))
}

export default function ShippingPolicy({ params }) {
  return <PolicyPage lang={params.lang} doc="shipping" />
}
