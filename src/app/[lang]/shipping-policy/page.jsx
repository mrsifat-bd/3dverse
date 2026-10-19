import PolicyPage from '@/components/PolicyPage'
import { getServerT } from '@/i18n/server'
import { seo } from '@/i18n/seo'

export async function generateMetadata(props) {
  const params = await props.params;
  const t = getServerT(params.lang)
  return seo('/shipping-policy', params.lang, t('meta.shippingTitle'), t('meta.shippingDescription'))
}

export default async function ShippingPolicy(props) {
  const params = await props.params;
  return <PolicyPage lang={params.lang} doc="shipping" />
}
