import PolicyPage from '@/components/PolicyPage'
import { getSettings } from '@/lib/settings'
import { getServerT } from '@/i18n/server'
import { seo } from '@/i18n/seo'

export async function generateMetadata(props) {
  const params = await props.params;
  const t = getServerT(params.lang)
  return seo('/privacy-policy', params.lang, t('meta.privacyTitle'), t('meta.privacyDescription'))
}

export default async function PrivacyPolicy(props) {
  const params = await props.params;
  const s = await getSettings()
  return <PolicyPage lang={params.lang} doc="privacy" vars={{ email: s.email, phone: s.phone }} />
}
