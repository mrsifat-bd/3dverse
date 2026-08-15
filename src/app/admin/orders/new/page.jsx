import NewOrderForm from '@/components/admin/NewOrderForm'

export const metadata = { title: 'New order', robots: { index: false, follow: false } }

export default function AdminNewOrderPage() {
  return <NewOrderForm />
}
