'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getReviews, submitReview } from '@/lib/social'
import { getMyProfile } from '@/lib/profile'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function ProductReviews({ productId }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [reviews, setReviews] = useState(null)
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { getReviews(productId).then(setReviews).catch(() => setReviews([])) }, [productId])
  useEffect(() => { if (user) getMyProfile().then(({ profile }) => setName(profile?.full_name || '')).catch(() => {}) }, [user])

  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true)
    try { await submitReview(productId, text, name); setText(''); setDone(true) }
    catch (err) { setError(err.message === 'LOGIN_REQUIRED' ? 'Please log in to review.' : err.message) }
    finally { setBusy(false) }
  }

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-semibold text-ink">
        Reviews {reviews && reviews.length > 0 && <span className="text-stone">({reviews.length})</span>}
      </h2>

      {user ? (
        done ? (
          <p className="mt-4 max-w-2xl rounded-xl border border-clay/30 bg-clay/5 p-3 text-sm text-stone">Thanks! Your review has been submitted and will appear once approved.</p>
        ) : (
          <form onSubmit={submit} className="mt-4 max-w-2xl">
            <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Share your experience with this product…" required />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" className="mt-3" disabled={busy}>{busy ? 'Submitting…' : 'Submit review'}</Button>
          </form>
        )
      ) : (
        <p className="mt-4 text-sm text-stone">
          <Link href={`/login?next=${encodeURIComponent(pathname || '/')}`} className="text-clay hover:underline">Log in</Link> to write a review.
        </p>
      )}

      <div className="mt-8 max-w-2xl space-y-4">
        {reviews === null ? (
          <Loader2 className="h-5 w-5 animate-spin text-stone" />
        ) : reviews.length === 0 ? (
          <p className="text-sm text-stone">No reviews yet. Be the first to review this product.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-paper p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-ink">{r.user_name || 'Customer'}</p>
                <span className="text-xs text-stone">{new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone">{r.comment}</p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
