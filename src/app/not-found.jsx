import NotFoundBody from '@/components/NotFoundBody'

// Shared 404 for every URL (English and /bn). The body picks the language from
// the URL on the client.
export default function NotFound() {
  return <NotFoundBody />
}
