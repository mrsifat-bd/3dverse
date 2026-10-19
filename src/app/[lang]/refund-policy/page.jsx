import PolicyPage from '@/components/PolicyPage'
import { getServerT } from '@/i18n/server'
import { seo } from '@/i18n/seo'

export async function generateMetadata(props) {
  const params = await props.params;
  const t = getServerT(params.lang)
  return seo('/refund-policy', params.lang, t('meta.refundTitle'), t('meta.refundDescription'))
}

export default async function RefundPolicy(props) {
  const params = await props.params;
  return <PolicyPage lang={params.lang} doc="refund" />
}
