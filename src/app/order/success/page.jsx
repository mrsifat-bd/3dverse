import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { getSettings } from '@/lib/settings'

export const metadata = {
  title: 'Order placed',
  robots: { index: false, follow: false },
}

export default async function OrderSuccessPage({ searchParams }) {
  const orderNumber = searchParams?.n || ''
  const s = await getSettings()
  const waHref = `https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমার অর্ডার নম্বর ${orderNumber}। অর্ডারটি নিশ্চিত করতে চাই।`
  )}`

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-line bg-paper p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-clay/10 text-clay">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink">Order placed</h1>
        {orderNumber && (
          <p className="mt-2 text-sm text-stone">
            Your order number is <span className="font-semibold text-ink">{orderNumber}</span>.
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Thank you! Our team will confirm your order, delivery charge and lead time by phone or WhatsApp.
          No online payment is needed — you pay on delivery.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn-primary">Confirm on WhatsApp</a>
          <Link href="/shop" className="btn-ghost">Continue shopping</Link>
        </div>
      </div>
    </div>
  )
}
