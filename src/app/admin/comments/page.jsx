import CommentsTable from '@/components/admin/CommentsTable'

export const metadata = { title: 'Reviews', robots: { index: false, follow: false } }

export default function AdminCommentsPage() {
  return <CommentsTable />
}
