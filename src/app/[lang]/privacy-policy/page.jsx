import PolicyPage from '@/components/PolicyPage'
import { getSettings } from '@/lib/settings'
import { getServerT } from '@/i18n/server'
import { seo } from '@/i18n/seo'

export function generateMetadata({ params }) {
  const t = getServerT(params.lang)
  return seo('/privacy-policy', params.lang, t('meta.privacyTitle'), t('meta.privacyDescription'))
}

export default async function PrivacyPolicy({ params }) {
  const s = await getSettings()
  return <PolicyPage lang={params.lang} doc="privacy" vars={{ email: s.email, phone: s.phone }} />
}
