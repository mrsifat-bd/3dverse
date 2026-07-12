import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container grid place-items-center py-28 text-center">
      <div>
        <p className="font-display text-6xl font-semibold text-clay">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-stone">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="btn-primary mt-6">Back to home</Link>
      </div>
    </div>
  )
}
