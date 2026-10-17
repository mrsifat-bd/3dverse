import Link from 'next/link'
import { EN_FAQ, BN_FAQ } from '@/lib/faq'

export const metadata = {
  title: 'FAQ — Ordering, Delivery & Payment',
  description: 'Answers about ordering 3D printed products from 3D Verse BD: delivery charges, bKash payment, cash on delivery, timelines, tracking and returns. Bangla FAQ included.',
  alternates: { canonical: '/faq' },
}

function Item({ q, a, bn }) {
  return (
    <details className={`group rounded-xl border border-line bg-paper px-5 py-4 ${bn ? 'font-bangla' : ''}`}>
      <summary className="cursor-pointer list-none text-sm font-medium text-ink marker:hidden">{q}</summary>
      <p className="mt-2 text-sm leading-relaxed text-stone">{a}</p>
    </details>
  )
}

export default function FaqPage() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: EN_FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return (
    <div className="container max-w-3xl py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <nav className="mb-6 flex items-center gap-1 text-xs text-stone" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-clay">Home</Link><span>/</span><span className="text-ink">FAQ</span>
      </nav>
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Frequently asked questions</h1>
      <p className="mt-3 text-base text-stone">Ordering, delivery, payment and returns, in English and বাংলা.</p>

      <div className="mt-8 space-y-3">
        {EN_FAQ.map((f) => <Item key={f.q} {...f} />)}
      </div>

      <h2 lang="bn" className="mt-14 font-bangla text-2xl font-semibold text-ink">সাধারণ প্রশ্ন</h2>
      <div lang="bn" className="mt-6 space-y-3">
        {BN_FAQ.map((f) => <Item key={f.q} {...f} bn />)}
      </div>

      <p className="mt-12 text-sm text-stone">
        More detail: <Link href="/shipping-policy" className="text-clay hover:underline">Shipping</Link> ·{' '}
        <Link href="/refund-policy" className="text-clay hover:underline">Refunds &amp; returns</Link> ·{' '}
        <Link href="/track" className="text-clay hover:underline">Track your order</Link> ·{' '}
        <Link href="/contact" className="text-clay hover:underline">Contact us</Link>
      </p>
    </div>
  )
}
