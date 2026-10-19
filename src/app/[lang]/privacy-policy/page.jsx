import PolicyPage from '@/components/PolicyPage'
import { getSettings } from '@/lib/settings'
import { getServerT } from '@/i18n/server'
import { alternatesFor } from '@/i18n/config'

export function generateMetadata({ params }) {
  const t = getServerT(params.lang)
  return { title: t('meta.privacyTitle'), description: t('meta.privacyDescription'), alternates: alternatesFor('/privacy-policy', params.lang) }
}

export default async function PrivacyPolicy({ params }) {
  const s = await getSettings()
  return <PolicyPage lang={params.lang} doc="privacy" vars={{ email: s.email, phone: s.phone }} />
}
