import CategoriesTable from '@/components/admin/CategoriesTable'

export const metadata = { title: 'Categories', robots: { index: false, follow: false } }

export default function AdminCategoriesPage() {
  return <CategoriesTable />
}
