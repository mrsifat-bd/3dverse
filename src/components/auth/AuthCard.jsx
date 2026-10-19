'use client'
import Link from '@/components/LocalizedLink'
import Image from 'next/image'
import * as m from 'motion/react-m'
import { useSettings } from '@/components/SettingsProvider'
import { useT } from '@/i18n/client'

// Centered auth card matching the 3D Verse dark premium theme.
export default function AuthCard({ title, subtitle, children, footer }) {
  const s = useSettings()
  const t = useT()
  return (
    <div className="container flex min-h-[75vh] items-center justify-center py-14">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md rounded-3xl border border-line bg-paper p-8"
      >
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <Image src="/logo-sm.webp" alt={t('common.logoAlt', { name: s.business_name })} width={40} height={44} className="h-9 w-auto dark:invert" />
          <span className="font-display text-xl font-semibold tracking-tight text-ink">{s.business_name}</span>
        </Link>
        <h1 className="text-center font-display text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-center text-sm text-stone">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-stone">{footer}</div>}
      </m.div>
    </div>
  )
}
