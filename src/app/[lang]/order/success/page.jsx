import { redirect } from 'next/navigation'
import { localizeHref } from '@/i18n/config'

// Old "order placed" page from the retired phone/WhatsApp order form. Every
// order now goes through checkout (delivery charge via bKash, product price
// cash on delivery), so old links go to the customer's order list.
export default function OldOrderSuccessPage({ params }) {
  redirect(localizeHref('/account/orders', params.lang))
}
