import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverSupabase'
import { processProductImage, makeCardVariant, cardPathFor, PROCESSED_PATH, ImageRejectedError, MAX_UPLOAD_BYTES } from '@/lib/server/productImage'
import { PRODUCTS_BUCKET } from '@/lib/supabaseClient'

// Admin-only product image upload. The browser sends the file here; the server
// validates it, converts it to a metadata-free WebP and stores ONLY that
// processed file. The original upload is never written to storage.
//
// Storage writes use the admin's own session (no service-role key), so the
// bucket's RLS policy (is_admin()) is enforced by the database as well.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const json = (body, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export async function POST(req) {
  const auth = await requireAdmin(req)
  if (auth.error) return json({ error: auth.error }, auth.status)
  const { supabase } = auth

  // Second, database-side check (same rule the storage policy uses).
  const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin')
  if (adminErr || isAdmin !== true) return json({ error: 'Forbidden.' }, 403)

  const len = Number(req.headers.get('content-length') || 0)
  if (len > MAX_UPLOAD_BYTES + 64 * 1024) {
    return json({ error: 'The image is too large to upload. Please use a file under 4 MB.' }, 413)
  }

  let file
  try {
    const form = await req.formData()
    file = form.get('file')
  } catch {
    return json({ error: 'Upload was incomplete. Please try again.' }, 400)
  }
  if (!file || typeof file.arrayBuffer !== 'function') {
    return json({ error: 'No image was received.' }, 400)
  }

  let img
  try {
    img = await processProductImage(Buffer.from(await file.arrayBuffer()))
  } catch (err) {
    if (err instanceof ImageRejectedError) return json({ error: err.message }, err.status)
    console.error('product-images: processing failed', err)
    return json({ error: 'The image could not be processed.' }, 500)
  }

  const bucket = supabase.storage.from(PRODUCTS_BUCKET)
  const isDuplicate = (e) => e && (String(e.statusCode) === '409' || /exists|duplicate/i.test(e.message || ''))
  const put = (path, data) => bucket.upload(path, data, {
    contentType: img.contentType,
    cacheControl: '31536000', // content-hashed name: safe to cache for a year
    upsert: false,
  })
  // Full image + card-size variant (used by product grids and thumbnails).
  const [{ error: upErr }, { error: cardErr }] = await Promise.all([put(img.path, img.data), put(img.card.path, img.card.data)])
  // Same content hash already stored = identical photo; reuse it.
  const duplicate = isDuplicate(upErr)
  if ((upErr && !duplicate) || (cardErr && !isDuplicate(cardErr))) {
    console.error('product-images: storage upload failed', upErr || cardErr)
    return json({ error: 'Saving the processed image failed. Please try again.' }, 502)
  }

  const { data } = bucket.getPublicUrl(img.path)
  return json({
    url: data.publicUrl,
    path: img.path,
    width: img.width,
    height: img.height,
    bytes: img.bytes,
    inputBytes: img.inputBytes,
    inputFormat: img.inputFormat,
    format: 'webp',
    cardBytes: img.card.bytes,
    duplicate: Boolean(duplicate),
  })
}

// One-off / idempotent backfill: creates the 640px card variant for processed
// images uploaded before variants existed. Only reads files that are already
// clean WebP in our bucket; never touches anything else. Safe to re-run.
export async function PATCH(req) {
  const auth = await requireAdmin(req)
  if (auth.error) return json({ error: auth.error }, auth.status)
  const { supabase } = auth
  const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin')
  if (adminErr || isAdmin !== true) return json({ error: 'Forbidden.' }, 403)

  const bucket = supabase.storage.from(PRODUCTS_BUCKET)
  const { data: files, error } = await bucket.list('products', { limit: 1000 })
  if (error) return json({ error: 'Could not list images.' }, 502)
  const names = new Set(files.map((f) => `products/${f.name}`))
  const todo = [...names].filter((p) => PROCESSED_PATH.test(p) && !names.has(cardPathFor(p)))

  const started = Date.now()
  const done = []
  const failed = []
  for (const path of todo) {
    if (Date.now() - started > 20_000) break // stay inside the function time limit; call again
    const { data: blob, error: dlErr } = await bucket.download(path)
    if (dlErr || !blob) { failed.push(path); continue }
    try {
      const card = await makeCardVariant(Buffer.from(await blob.arrayBuffer()))
      const { error: upErr } = await bucket.upload(cardPathFor(path), card.data, {
        contentType: 'image/webp', cacheControl: '31536000', upsert: false,
      })
      if (upErr && !/exists|duplicate/i.test(upErr.message || '') && String(upErr.statusCode) !== '409') failed.push(path)
      else done.push(path)
    } catch {
      failed.push(path)
    }
  }
  return json({ checked: names.size, missing: todo.length, created: done.length, failed, remaining: todo.length - done.length - failed.length })
}
