import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverSupabase'
import { processProductImage, ImageRejectedError, MAX_UPLOAD_BYTES } from '@/lib/server/productImage'
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
  const { error: upErr } = await bucket.upload(img.path, img.data, {
    contentType: img.contentType,
    cacheControl: '31536000', // content-hashed name: safe to cache for a year
    upsert: false,
  })
  // Same content hash already stored = identical photo; reuse it.
  const duplicate = upErr && (String(upErr.statusCode) === '409' || /exists|duplicate/i.test(upErr.message || ''))
  if (upErr && !duplicate) {
    console.error('product-images: storage upload failed', upErr)
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
    duplicate: Boolean(duplicate),
  })
}
