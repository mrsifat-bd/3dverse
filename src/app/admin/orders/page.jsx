import OrdersTable from '@/components/admin/OrdersTable'

export const metadata = { title: 'Orders', robots: { index: false, follow: false } }

export default function AdminOrdersPage() {
  return <OrdersTable />
}
