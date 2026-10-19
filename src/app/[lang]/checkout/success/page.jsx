import Link from '@/components/LocalizedLink'
import { CheckCircle2 } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { getServerT } from '@/i18n/server'

export async function generateMetadata(props) {
  const params = await props.params;
  const t = getServerT(params.lang)
  return { title: t('success.metaTitle'), robots: { index: false, follow: false } }
}

export default async function CheckoutSuccessPage(props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { lang } = params
  const t = getServerT(lang)
  // Order number and transaction ID are shown exactly as issued (never translated).
  const n = searchParams?.n || ''
  const cod = Number(searchParams?.cod || 0)
  const delivery = Number(searchParams?.delivery || 0)
  const txn = searchParams?.txn || ''

  return (
    <div className="container py-16">
      <div className="enter mx-auto max-w-md rounded-3xl border border-line bg-paper p-8 text-center">
        <span className="pop mx-auto grid h-14 w-14 place-items-center rounded-full bg-clay/10 text-clay"><CheckCircle2 className="h-7 w-7" /></span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink">{t('success.title')}</h1>
        {n && <p className="mt-1 text-sm text-stone">{t('success.order')} <span className="font-semibold text-ink" lang="en">{n}</span></p>}

        <div className="mt-6 space-y-2 rounded-2xl border border-line bg-cream p-4 text-left text-sm">
          <div className="flex justify-between gap-3"><span className="text-stone">{t('success.deliveryPayment')}</span><span className="font-medium text-clay">{t('orders.payPending')}</span></div>
          <div className="flex justify-between gap-3"><span className="text-stone">{t('success.bkashTxn')}</span><span className="font-medium text-ink" lang="en">{txn || '—'}</span></div>
          <div className="flex justify-between gap-3"><span className="text-stone">{t('cart.delivery')}</span><span className="font-medium text-ink">{formatPrice(delivery, lang)}</span></div>
          <div className="flex justify-between gap-3"><span className="text-stone">{t('success.productPayment')}</span><span className="font-medium text-ink">{t('success.cashOnDelivery')}</span></div>
          <div className="flex justify-between gap-3"><span className="text-stone">{t('success.codAmount')}</span><span className="font-medium text-ink">{formatPrice(cod, lang)}</span></div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-stone">{t('success.text')}</p>
        <p className="mt-2 text-xs leading-relaxed text-stone">{t('success.cancelHint')}</p>

        <div className="mt-6 flex flex-col gap-3">
          <Link href="/account/orders" className="btn-primary">{t('success.viewOrders')}</Link>
          {n && <Link href={`/track?n=${encodeURIComponent(n)}`} className="btn-ghost">{t('success.track')}</Link>}
          <Link href="/shop" className="btn-ghost">{t('cart.continue')}</Link>
        </div>
      </div>
    </div>
  )
}
