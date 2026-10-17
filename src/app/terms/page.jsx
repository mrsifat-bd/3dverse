import Link from 'next/link'
import PolicyPage from '@/components/PolicyPage'

export const metadata = {
  title: 'Terms & Conditions',
  description: 'The terms for ordering made-to-order 3D printed products from 3D Verse BD in Sylhet, Bangladesh.',
  alternates: { canonical: '/terms' },
}

export default function Terms() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      updated="17 October 2026"
      intro="These terms apply when you use 3dversebd.com or order from 3D Verse BD. By placing an order you agree to them."
      bn={<p>পণ্য অর্ডারের পর প্রিন্ট করা হয়। বিকাশে ডেলিভারি চার্জ যাচাই হওয়ার পর অর্ডার কনফার্ম হয়। দাম বাংলাদেশি টাকায়। মেডিকেল মডেলগুলো শিক্ষা ও প্রদর্শনের জন্য, চিকিৎসা যন্ত্র নয়।</p>}
      sections={[
        {
          heading: 'Orders and prices',
          body: [
            'All prices are in Bangladeshi Taka (৳). Products are made to order. Your order is confirmed once we have verified your bKash delivery-charge payment; until then we may cancel it, for example if a product cannot be made.',
            'If a price on the site is clearly wrong, we will contact you before printing and you can cancel at no cost.',
          ],
        },
        {
          heading: 'Payment',
          body: ['You pay the delivery charge in advance by bKash and the product price in cash on delivery. A transaction ID that matches the format is not proof of payment; we check each payment by hand.'],
        },
        {
          heading: 'Products',
          body: [
            'Sizes and weights are approximate. Colours on screen and in photos, some of which are digital renders, can differ slightly from the printed item. Fine layer lines are normal for 3D printing.',
            'Medical and anatomical models are for education, study and display only. They are not medical devices and must not be used for diagnosis or treatment.',
          ],
        },
        {
          heading: 'Custom orders',
          body: ['For custom prints you must own, or have permission to use, any design, logo or file you send us. We may refuse designs that infringe someone else’s rights or are unsafe or illegal.'],
        },
        {
          heading: 'Delivery, returns and privacy',
          body: [
            <>Delivery is covered in our <Link href="/shipping-policy" className="text-clay hover:underline">Shipping policy</Link>, returns and refunds in our <Link href="/refund-policy" className="text-clay hover:underline">Refund policy</Link>, and your data in our <Link href="/privacy-policy" className="text-clay hover:underline">Privacy policy</Link>.</>,
          ],
        },
        {
          heading: 'Liability',
          body: ['Our responsibility for any order is limited to the amount you paid for it. Nothing in these terms takes away rights you have under the laws of Bangladesh.'],
        },
        {
          heading: 'Changes',
          body: ['We may update these terms. The version on this page when you place your order applies to that order.'],
        },
      ]}
    />
  )
}
