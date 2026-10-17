import { Suspense } from 'react'
import TrackOrder from '@/components/TrackOrder'

export const metadata = {
  title: 'Track Your Order',
  description: 'Check the status of your 3D Verse BD order with your order number and phone number. অর্ডার নম্বর ও ফোন নম্বর দিয়ে অর্ডারের অবস্থা দেখুন।',
  alternates: { canonical: '/track' },
}

export default function TrackPage() {
  return (
    <div className="container max-w-xl py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Track your order</h1>
      <p className="mt-2 text-sm text-stone">Enter the order number from your confirmation and the phone number you ordered with.</p>
      <p lang="bn" className="mt-1 font-bangla text-sm text-stone">অর্ডার নম্বর ও যে ফোন নম্বর দিয়ে অর্ডার করেছেন তা লিখুন।</p>
      <Suspense fallback={null}>
        <TrackOrder />
      </Suspense>
    </div>
  )
}
