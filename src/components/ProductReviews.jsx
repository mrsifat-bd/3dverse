'use client'
import { useEffect, useState } from 'react'
import Link from '@/components/LocalizedLink'
import { useLang, useT } from '@/i18n/client'
import { formatDate, formatNumber, textLang } from '@/lib/format'
import { usePathname } from 'next/navigation'
import { Loader2, Star, ImagePlus, X, BadgeCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getReviews, submitReview, uploadReviewPhoto } from '@/lib/social'
import { cardImage } from '@/lib/format'
import { getMyProfile } from '@/lib/profile'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function ProductReviews({ productId }) {
  const { user } = useAuth()
  const t = useT()
  const lang = useLang()
  const pathname = usePathname()
  const [reviews, setReviews] = useState(null)
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [photo, setPhoto] = useState({ url: '', preview: '', busy: false })

  useEffect(() => { getReviews(productId).then(setReviews).catch(() => setReviews([])) }, [productId])
  useEffect(() => { if (user) getMyProfile().then(({ profile }) => setName(profile?.full_name || '')).catch(() => {}) }, [user])

  async function pickPhoto(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setError(t('reviews.photoType')); return }
    setError('')
    const preview = URL.createObjectURL(f)
    setPhoto({ url: '', preview, busy: true })
    try {
      const url = await uploadReviewPhoto(f)
      setPhoto({ url, preview, busy: false })
    } catch (err) {
      setPhoto({ url: '', preview: '', busy: false })
      setError(err.message === 'LOGIN_REQUIRED' ? t('reviews.loginPhoto') : err.message === 'RATE_LIMITED' ? t('reviews.rateLimited') : t('reviews.photoFailed'))
    }
  }

  async function submit(e) {
    e.preventDefault(); setError('')
    if (!rating) { setError(t('reviews.chooseRating')); return }
    if (text.trim().length < 3) { setError(t('reviews.writeMore')); return }
    if (photo.busy) { setError(t('reviews.waitPhoto')); return }
    setBusy(true)
    try { await submitReview(productId, text, name, rating, photo.url); setText(''); setRating(0); setPhoto({ url: '', preview: '', busy: false }); setDone(true) }
    catch (err) { setError(err.message === 'LOGIN_REQUIRED' ? t('reviews.loginReview') : /RATE_LIMITED/.test(err.message || '') ? t('reviews.rateLimited') : t('reviews.failed')) }
    finally { setBusy(false) }
  }

  return (
    <section id="reviews" className="mt-16 scroll-mt-24">
      <h2 className="font-display text-2xl font-semibold text-ink">
        {t('reviews.title')} {reviews && reviews.length > 0 && <span className="text-stone">({formatNumber(reviews.length, lang)})</span>}
      </h2>

      {user ? (
        done ? (
          <p role="status" className="enter mt-4 max-w-2xl rounded-xl border border-clay/30 bg-clay/5 p-3 text-sm text-stone">{t('reviews.thanks')}</p>
        ) : (
          <form onSubmit={submit} className="mt-4 max-w-2xl">
            <div className="mb-3 flex items-center gap-1" role="radiogroup" aria-label={t('reviews.yourRating')} onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={t('reviews.stars', { n })}
                  onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} className="rounded p-0.5 transition-transform hover:scale-110">
                  <Star className={`h-6 w-6 ${n <= (hover || rating) ? 'fill-clay text-clay' : 'text-line'}`} />
                </button>
              ))}
              <span className="ml-2 text-sm text-stone">{rating ? `${formatNumber(rating, lang)} / ${formatNumber(5, lang)}` : t('reviews.tapToRate')}</span>
            </div>
            <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('reviews.placeholder')} required />
            <div className="mt-3 flex items-center gap-3">
              {photo.preview ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.preview} alt={t('reviews.yourPhoto')} className="h-full w-full object-cover" />
                  {photo.busy ? (
                    <span className="absolute inset-0 grid place-items-center bg-black/40"><Loader2 className="h-5 w-5 animate-spin text-white" /></span>
                  ) : (
                    <button type="button" onClick={() => setPhoto({ url: '', preview: '', busy: false })} aria-label={t('reviews.removePhoto')}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"><X className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              ) : (
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-clay/40 hover:text-clay">
                  <ImagePlus className="h-4 w-4" /> {t('reviews.addPhoto')}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickPhoto} />
                </label>
              )}
              <span className="text-xs text-stone">{t('reviews.photoHint')}</span>
            </div>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" className="mt-3" disabled={busy}>{busy ? t('reviews.submitting') : t('reviews.submit')}</Button>
          </form>
        )
      ) : (
        <p className="mt-4 text-sm text-stone">
          <Link href={`/login?next=${encodeURIComponent(pathname || '/')}`} className="text-clay underline underline-offset-2">{t('auth.logIn')}</Link> {t('reviews.toWrite')}
        </p>
      )}

      <div className="mt-8 max-w-2xl space-y-4">
        {reviews === null ? (
          <Loader2 className="h-5 w-5 animate-spin text-stone" />
        ) : reviews.length === 0 ? (
          <p className="text-sm text-stone">{t('reviews.empty')}</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-paper p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                  {r.user_name || t('reviews.customer')}
                  {r.verified && <span className="inline-flex items-center gap-1 rounded-full bg-[#5B8A5B]/10 px-2 py-0.5 text-xs font-medium text-[#5B8A5B]"><BadgeCheck className="h-3.5 w-3.5" /> {t('reviews.verified')}</span>}
                </p>
                <span className="text-xs text-stone">{formatDate(r.created_at, lang)}</span>
              </div>
              {r.rating ? (
                <span className="mt-1 flex" aria-label={t('reviews.outOf5', { n: r.rating })}>
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= r.rating ? 'fill-clay text-clay' : 'text-line'}`} />)}
                </span>
              ) : null}
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone" lang={textLang(r.comment) !== lang ? textLang(r.comment) : undefined}>{r.comment}</p>
              {r.photo_url && (
                <a href={r.photo_url} target="_blank" rel="noopener noreferrer" className="mt-3 block h-28 w-28 overflow-hidden rounded-xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cardImage(r.photo_url)} alt={t('reviews.photoFrom', { name: r.user_name || t('reviews.customer') })} loading="lazy" className="h-full w-full object-cover"
                    onError={(e) => { if (e.currentTarget.src !== r.photo_url) e.currentTarget.src = r.photo_url }} />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
