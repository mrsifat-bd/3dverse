import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/serverSupabase'
import { processProductImage, ImageRejectedError, MAX_UPLOAD_BYTES } from '@/lib/server/productImage'

// Customer review photo upload (logged-in customers only). Same pipeline as
// product photos: real-bytes check, WebP, all metadata (incl. GPS) removed.
// Stored with the customer's own session, so storage RLS only lets them write
// into reviews/<their user id>/ in the public "review-photos" bucket.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const BUCKET = 'review-photos'
const json = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export async function POST(req) {
  const auth = await requireUser(req)
  if (auth.error) return json({ error: auth.error }, auth.status)
  const { supabase, user } = auth

  // Database-backed limit (10 photos per customer per hour), shared by every
  // server instance. If the limiter itself is unavailable we refuse rather than
  // allow unlimited uploads; the only exception is the function not existing
  // yet (code deployed before migration_hardening_2), which must not break
  // reviews.
  const { error: rlErr } = await supabase.rpc('consume_rate_limit', { p_action: 'review_photo' })
  if (rlErr) {
    if (/RATE_LIMITED/.test(rlErr.message || '')) return json({ error: 'Too many photos. Please wait a while and try again.' }, 429)
    if (rlErr.code !== 'PGRST202') {
      console.error('review-photos: rate limiter unavailable', rlErr.code)
      return json({ error: 'Please try again in a moment.' }, 503)
    }
  }

  const len = Number(req.headers.get('content-length') || 0)
  if (len > MAX_UPLOAD_BYTES + 64 * 1024) return json({ error: 'The photo is too large. Please use one under 4 MB.' }, 413)

  let file
  try {
    file = (await req.formData()).get('file')
  } catch {
    return json({ error: 'Upload was incomplete. Please try again.' }, 400)
  }
  if (!file || typeof file.arrayBuffer !== 'function') return json({ error: 'No photo was received.' }, 400)

  let img
  try {
    img = await processProductImage(Buffer.from(await file.arrayBuffer()))
  } catch (err) {
    if (err instanceof ImageRejectedError) return json({ error: err.message }, err.status)
    console.error('review-photos: processing failed', err)
    return json({ error: 'The photo could not be processed.' }, 500)
  }

  const name = img.path.split('/').pop() // <hash>.webp
  const full = `reviews/${user.id}/${name}`
  const card = full.replace(/\.webp$/, '-640.webp')
  const bucket = supabase.storage.from(BUCKET)
  const put = (path, data) => bucket.upload(path, data, { contentType: 'image/webp', cacheControl: '31536000', upsert: false })
  const dup = (e) => e && (String(e.statusCode) === '409' || /exists|duplicate/i.test(e.message || ''))
  const [a, b] = await Promise.all([put(full, img.data), put(card, img.card.data)])
  if ((a.error && !dup(a.error)) || (b.error && !dup(b.error))) {
    console.error('review-photos: storage upload failed', a.error || b.error)
    return json({ error: 'Saving the photo failed. Please try again.' }, 502)
  }
  return json({ url: bucket.getPublicUrl(full).data.publicUrl })
}
