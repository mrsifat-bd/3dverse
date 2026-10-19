import { redirect } from 'next/navigation'
import { localizeHref } from '@/i18n/config'

// Old single-product order page (from when orders were confirmed by phone /
// WhatsApp with no payment step). Every order now goes through the cart and
// checkout (delivery charge via bKash, product price cash on delivery), so
// old links are sent to the product page, where Add to cart / Buy now live.
export default async function OrderPage(props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const slug = typeof searchParams?.product === 'string' ? searchParams.product : ''
  redirect(localizeHref(slug ? `/product/${encodeURIComponent(slug)}` : '/shop', params.lang))
}
