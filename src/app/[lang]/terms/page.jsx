import PolicyPage from '@/components/PolicyPage'
import { getServerT } from '@/i18n/server'
import { seo } from '@/i18n/seo'

export function generateMetadata({ params }) {
  const t = getServerT(params.lang)
  return seo('/terms', params.lang, t('meta.termsTitle'), t('meta.termsDescription'))
}

export default function TermsPolicy({ params }) {
  return <PolicyPage lang={params.lang} doc="terms" />
}
