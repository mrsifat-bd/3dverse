import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { formatPrice } from '@/lib/format'

export const metadata = { title: 'Order placed', robots: { index: false, follow: false } }

export default function CheckoutSuccessPage({ searchParams }) {
  const n = searchParams?.n || ''
  const cod = Number(searchParams?.cod || 0)
  const delivery = Number(searchParams?.delivery || 0)
  const txn = searchParams?.txn || ''

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-line bg-paper p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-clay/10 text-clay"><CheckCircle2 className="h-7 w-7" /></span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink">Order submitted successfully</h1>
        {n && <p className="mt-1 text-sm text-stone">Order <span className="font-semibold text-ink">{n}</span></p>}

        <div className="mt-6 space-y-2 rounded-2xl border border-line bg-cream p-4 text-left text-sm">
          <div className="flex justify-between gap-3"><span className="text-stone">Delivery payment</span><span className="font-medium text-clay">Pending verification</span></div>
          <div className="flex justify-between gap-3"><span className="text-stone">bKash transaction</span><span className="font-medium text-ink">{txn || '—'}</span></div>
          <div className="flex justify-between gap-3"><span className="text-stone">Delivery charge</span><span className="font-medium text-ink">{formatPrice(delivery)}</span></div>
          <div className="flex justify-between gap-3"><span className="text-stone">Product payment</span><span className="font-medium text-ink">Cash on Delivery</span></div>
          <div className="flex justify-between gap-3"><span className="text-stone">COD amount</span><span className="font-medium text-ink">{formatPrice(cod)}</span></div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-stone">
          Thank you! We&apos;ll verify your bKash delivery payment and confirm your order shortly. You can follow its status in your account.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link href="/account/orders" className="btn-primary">View my orders</Link>
          <Link href="/shop" className="btn-ghost">Continue shopping</Link>
        </div>
      </div>
    </div>
  )
}
