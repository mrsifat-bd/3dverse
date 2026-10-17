import { redirect } from 'next/navigation'

// Old single-product order page (from when orders were confirmed by phone /
// WhatsApp with no payment step). Every order now goes through the cart and
// checkout (delivery charge via bKash, product price cash on delivery), so
// old links are sent to the product page, where Add to cart / Buy now live.
export default function OrderPage({ searchParams }) {
  const slug = typeof searchParams?.product === 'string' ? searchParams.product : ''
  redirect(slug ? `/product/${encodeURIComponent(slug)}` : '/shop')
}
