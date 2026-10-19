'use client'
import Link from './LocalizedLink'
import { useT } from '@/i18n/client'

export default function NotFoundBody() {
  const t = useT()
  return (
    <div className="container grid place-items-center py-28 text-center">
      <div className="enter">
        <p className="font-display text-6xl font-semibold text-clay">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">{t('notFound.title')}</h1>
        <p className="mt-2 text-sm text-stone">{t('notFound.text')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">{t('notFound.home')}</Link>
          <Link href="/shop" className="btn-ghost">{t('cart.browse')}</Link>
        </div>
      </div>
    </div>
  )
}
