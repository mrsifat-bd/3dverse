import PolicyPage from '@/components/PolicyPage'
import { getSettings } from '@/lib/settings'

export const metadata = {
  title: 'Privacy Policy',
  description: 'What personal information 3D Verse BD collects, why, who it is shared with, and how to ask us to delete it.',
  alternates: { canonical: '/privacy-policy' },
}

export default async function PrivacyPolicy() {
  const s = await getSettings()
  return (
    <PolicyPage
      title="Privacy Policy"
      updated="17 October 2026"
      intro="We collect only what we need to take and deliver your orders. We never sell your information."
      bn={<p>অর্ডার নেওয়া ও ডেলিভারির জন্য যতটুকু দরকার, শুধু ততটুকু তথ্য আমরা রাখি: নাম, ফোন, ঠিকানা, থানা ও বিকাশ ট্রানজ্যাকশন আইডি। ডেলিভারির জন্য এগুলো কুরিয়ারকে দেওয়া হয়। আপনার তথ্য কখনো বিক্রি করা হয় না। তথ্য মুছে ফেলতে চাইলে আমাদের জানান।</p>}
      sections={[
        {
          heading: 'What we collect',
          body: [
            [
              'Account details: your email address, name and profile picture if you add one, or the basic profile Google or Facebook shares when you log in with them.',
              'Order details: name, phone number, delivery address, police station (thana), order notes and the bKash transaction ID for your delivery charge.',
              'Reviews you write, including any photo you attach.',
              'Your email address if you subscribe to offers.',
              'Basic, non-personal visit data: approximate city or country, device type and browser, and which products are viewed. A random visitor ID is kept in your browser to count visits.',
            ],
          ],
        },
        {
          heading: 'Why we use it',
          body: [
            ['To process, verify and deliver your orders and keep you updated about them.', 'To answer your questions and handle returns.', 'To improve the shop, for example knowing which products people look at.', 'To send offers, only if you subscribed. You can unsubscribe at any time.'],
          ],
        },
        {
          heading: 'Who we share it with',
          body: [
            'Only the services needed to run the shop:',
            [
              'Steadfast Courier, which receives your name, phone, address and the cash-on-delivery amount to deliver your parcel.',
              'Supabase and Vercel, which host our database and website.',
              'Our email provider, which sends order emails.',
              'Google or Facebook, only if you choose to log in with them.',
            ],
            'We do not sell or rent your information, and we do not share it for advertising.',
          ],
        },
        {
          heading: 'Cookies and browser storage',
          body: ['We use your browser storage to keep you logged in, remember your theme and count visits. We do not use advertising cookies.'],
        },
        {
          heading: 'How long we keep it',
          body: ['Order records are kept for our accounts and for warranty or delivery questions. You can ask us to delete your account and personal details at any time; we only keep what we must keep for completed orders.'],
        },
        {
          heading: 'Your choices',
          body: [`To see, correct or delete your information, email ${s.email} or call ${s.phone}. We reply within a few working days.`],
        },
      ]}
    />
  )
}
