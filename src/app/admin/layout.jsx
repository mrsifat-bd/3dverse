import AdminShell from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>
}
