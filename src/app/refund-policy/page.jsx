import PolicyPage from '@/components/PolicyPage'

export const metadata = {
  title: 'Refund & Return Policy',
  description: 'How returns, reprints and refunds work at 3D Verse BD for made-to-order 3D printed products, including damaged items and cancellations.',
  alternates: { canonical: '/refund-policy' },
}

export default function RefundPolicy() {
  return (
    <PolicyPage
      title="Refund & Return Policy"
      updated="17 October 2026"
      intro="Every item is printed specially for you, so returns work a little differently from a regular shop. We always make it right when something is our fault."
      bn={<p>পণ্য ভাঙা, ভুল বা ত্রুটিপূর্ণ হলে হাতে পাওয়ার ৪৮ ঘণ্টার মধ্যে ছবি/ভিডিওসহ জানালে আমরা আবার প্রিন্ট করে দেব অথবা টাকা ফেরত দেব। প্রিন্ট শুরুর আগে অর্ডার বাতিল করলে ডেলিভারি চার্জ ফেরত পাবেন। অর্ডার অনুযায়ী তৈরি হয় বলে শুধু মত পরিবর্তনের কারণে ফেরত নেওয়া হয় না।</p>}
      sections={[
        {
          heading: 'Damaged, wrong or faulty items',
          body: [
            'If your product arrives broken, is not what you ordered, or has a clear printing defect, tell us within 48 hours of delivery. Send your order number with clear photos or an unboxing video.',
            'We will reprint and resend the item at no cost to you. If a reprint is not possible, we refund what you paid for that item.',
          ],
        },
        {
          heading: 'Cancelling an order',
          body: [
            [
              'Before printing starts: cancel any time by contacting us. The bKash delivery charge is refunded in full.',
              'After printing has started: the order can no longer be cancelled, because the item is being made for you.',
            ],
            'If we cannot make or deliver your order for any reason, we cancel it and refund the delivery charge in full.',
          ],
        },
        {
          heading: 'Change of mind',
          body: [
            'Because products are made to order, we cannot accept returns just because you changed your mind, chose the wrong size or colour, or no longer need the item. Please check the product details, size and colour before ordering, and ask us if anything is unclear.',
          ],
        },
        {
          heading: 'What is normal for 3D prints',
          body: [
            'Fine layer lines, small surface marks and slight colour differences from photos are a normal part of 3D printing and are not defects. Some product photos are digital renders, so the printed item can look slightly different in colour and finish.',
          ],
        },
        {
          heading: 'How refunds are paid',
          body: [
            'Refunds are sent by bKash to the number you paid from, usually within 3 working days after we approve them. If you already paid the product price in cash, that amount is refunded by bKash too.',
          ],
        },
      ]}
    />
  )
}
