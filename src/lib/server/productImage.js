// SERVER ONLY. Turns an uploaded product photo into a clean, web-ready WebP.
//
// Pipeline: validate the real bytes → decode safely → apply camera rotation →
// resize to a sensible maximum → encode WebP → (all metadata dropped).
//
// Why each step:
// - We never trust the file name or the browser's MIME type. The first bytes
//   ("magic numbers") must match JPEG, PNG or WebP, and the decoder must agree.
// - sharp drops ALL embedded metadata by default (EXIF incl. camera/device,
//   GPS, dates and software tags, XMP, IPTC, comments, ICC profiles). We never
//   call withMetadata()/keepExif(), and we never add any metadata of our own.
//   Colours are converted to standard sRGB first so photos look the same
//   without their ICC profile.
// - .rotate() with no arguments bakes the EXIF orientation into the pixels
//   (so phone photos stay upright) before that EXIF is thrown away.
// - Pixel/dimension limits stop "decompression bomb" files from exhausting
//   the server's memory.
import crypto from 'node:crypto'
import sharp from 'sharp'

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 // Vercel caps request bodies at 4.5 MB
export const MAX_INPUT_PIXELS = 50_000_000 // ~50 megapixels
export const MAX_SIDE = 12_000 // px, per side, of the uploaded image
export const MIN_SIDE = 64 // px, smaller than this is not a usable product photo
export const OUTPUT_MAX_SIDE = 2000 // px, longest side of the stored image
export const WEBP_QUALITY = 84 // high enough that prints/textures stay crisp

export class ImageRejectedError extends Error {
  constructor(message, status = 422) {
    super(message)
    this.name = 'ImageRejectedError'
    this.status = status
  }
}

// Identify the real format from the file's first bytes.
export function sniffImageType(buf) {
  if (!buf || buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return 'png'
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return null
}

export async function processProductImage(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  if (!buf.length) throw new ImageRejectedError('The file is empty.')
  if (buf.length > MAX_UPLOAD_BYTES) {
    throw new ImageRejectedError('The image is too large to upload. Please use a file under 4 MB.', 413)
  }

  const sniffed = sniffImageType(buf)
  if (!sniffed) {
    throw new ImageRejectedError('This file is not a JPG, PNG or WebP image (its contents don’t match a supported format).', 415)
  }

  const opts = { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error', sequentialRead: true }
  let meta
  try {
    meta = await sharp(buf, opts).metadata()
  } catch {
    throw new ImageRejectedError('The image could not be read. It may be corrupted or incomplete.')
  }
  if (meta.format !== sniffed) {
    throw new ImageRejectedError('The image data does not match its format. Please re-save the photo and try again.')
  }
  const w = meta.width || 0
  const h = meta.height || 0
  if (w < MIN_SIDE || h < MIN_SIDE) {
    throw new ImageRejectedError(`The image is too small (${w}×${h}). Please use one at least ${MIN_SIDE}px on each side.`)
  }
  if (w > MAX_SIDE || h > MAX_SIDE) {
    throw new ImageRejectedError(`The image dimensions are too large (${w}×${h}). The limit is ${MAX_SIDE}px per side.`)
  }

  let out
  try {
    out = await sharp(buf, opts) // animated files: only the first frame is used
      .rotate()
      .toColourspace('srgb')
      .resize({ width: OUTPUT_MAX_SIDE, height: OUTPUT_MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, alphaQuality: 90, smartSubsample: true, effort: 5 })
      .toBuffer({ resolveWithObject: true })
  } catch {
    throw new ImageRejectedError('The image could not be processed. It may be corrupted.')
  }

  // Content hash → stable name. The same photo uploaded twice maps to the same
  // file, so duplicates are never stored.
  const hash = crypto.createHash('sha256').update(out.data).digest('hex').slice(0, 32)
  return {
    data: out.data,
    width: out.info.width,
    height: out.info.height,
    bytes: out.data.length,
    inputFormat: sniffed,
    inputBytes: buf.length,
    path: `products/${hash}.webp`,
    contentType: 'image/webp',
  }
}
