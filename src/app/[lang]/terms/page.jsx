import PolicyPage from '@/components/PolicyPage'
import { getServerT } from '@/i18n/server'
import { alternatesFor } from '@/i18n/config'

export function generateMetadata({ params }) {
  const t = getServerT(params.lang)
  return { title: t('meta.termsTitle'), description: t('meta.termsDescription'), alternates: alternatesFor('/terms', params.lang) }
}

export default function TermsPolicy({ params }) {
  return <PolicyPage lang={params.lang} doc="terms" />
}
