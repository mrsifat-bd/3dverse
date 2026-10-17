import Link from 'next/link'
import PolicyPage from '@/components/PolicyPage'

export const metadata = {
  title: 'Shipping & Delivery Policy',
  description: 'Delivery charges, zones and timelines for 3D Verse BD orders: ৳70 in Sylhet city, from ৳120 across Bangladesh. Delivery charge via bKash, product price cash on delivery.',
  alternates: { canonical: '/shipping-policy' },
}

export default function ShippingPolicy() {
  return (
    <PolicyPage
      title="Shipping & Delivery Policy"
      updated="17 October 2026"
      intro="Every product is 3D printed after you order, then sent by courier. Here is how delivery works, what it costs and how long it takes."
      bn={<p>সিলেট শহরে (সিলেট সদর ও দক্ষিণ সুরমা) ১ কেজি পর্যন্ত ডেলিভারি চার্জ ৳৭০, সারা বাংলাদেশে ১ কেজি পর্যন্ত ৳১২০। ডেলিভারি চার্জ চেকআউটে বিকাশে অগ্রিম দিতে হয়, পণ্যের দাম হাতে পেয়ে দেবেন। সাধারণত প্রিন্টে ১–৩ দিন ও কুরিয়ারে ১–৩ দিন লাগে।</p>}
      sections={[
        {
          heading: 'Delivery charges',
          body: [
            'The delivery charge depends on where you are and how heavy the parcel is. The exact amount is shown at checkout after you choose your police station (thana).',
            [
              'Sylhet city (Sylhet Sadar and Dakshin Surma thana): ৳70 up to 1 kg, ৳160 up to 2 kg, ৳190 up to 3 kg.',
              'Everywhere else in Bangladesh: ৳120 up to 1 kg, ৳210 up to 2 kg, ৳240 up to 3 kg.',
              'Above 3 kg: ৳30 for each extra kg.',
            ],
            'Parcel weight is the printed weight of your products plus about 80 g of packaging per item.',
          ],
        },
        {
          heading: 'How you pay',
          body: [
            'You pay only the delivery charge in advance, by bKash Send Money, during checkout. The product price is paid in cash to the courier when your parcel arrives (cash on delivery).',
            'We check every bKash payment by hand before we start printing. If something does not match, we contact you on the phone number you gave.',
          ],
        },
        {
          heading: 'How long it takes',
          body: [
            [
              'Printing: usually 1–3 working days after your payment is verified. Large models and full bone sets can take longer; we tell you when we confirm the order.',
              'Courier: usually 1–2 days inside Sylhet and 2–3 days to other districts.',
            ],
            'Delays can happen during holidays, bad weather or courier backlogs. We will keep you informed.',
          ],
        },
        {
          heading: 'Courier and tracking',
          body: [
            'Orders are delivered by Steadfast Courier. Once your parcel is handed over, a tracking code appears on your order.',
            <>You can check your order any time on the <Link href="/track" className="text-clay hover:underline">Track order</Link> page with your order number and phone number, or under My orders when you are logged in.</>,
          ],
        },
        {
          heading: 'At delivery',
          body: [
            'Please check the parcel in front of the delivery person before you pay. If it is damaged, you can refuse it and tell us right away.',
            'If a parcel is refused or cannot be delivered because the address or phone number was wrong, the delivery charge cannot be refunded, because the courier has already been paid.',
          ],
        },
      ]}
    />
  )
}
