// Shrinks a photo in the browser before it is uploaded to Supabase Storage.
//
// Why: phone photos are 2–6 MB and were stored as-is, so every product page
// downloaded megabytes of images. That used up the Supabase free plan's
// bandwidth and the project got blocked (HTTP 402). Resizing to a sensible
// maximum edge and re-encoding as WebP typically cuts a photo to ~100–250 KB
// with no visible loss on a product page.
//
// Safe by design: if anything goes wrong (old browser, unreadable file) the
// original file is returned unchanged, so uploads never break because of this.

const WEBP = 'image/webp'
const JPEG = 'image/jpeg'

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    if (canvas.convertToBlob) {
      canvas.convertToBlob({ type, quality }).then(resolve, () => resolve(null))
    } else {
      canvas.toBlob((b) => resolve(b), type, quality)
    }
  })
}

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      // 'from-image' applies the EXIF rotation so phone photos stay upright.
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* fall through to <img> decoding */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function targetSize(w, h, maxDim) {
  const scale = Math.min(1, maxDim / Math.max(w, h))
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) }
}

// Returns a new, smaller File (WebP where the browser can encode it, else JPEG).
// Returns the original File when compression isn't possible or wouldn't help.
export async function compressImage(file, { maxDim = 1600, quality = 0.82 } = {}) {
  if (typeof window === 'undefined' || !file || !file.type?.startsWith('image/')) return file
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  try {
    const src = await decode(file)
    const w = src.width || src.naturalWidth
    const h = src.height || src.naturalHeight
    if (!w || !h) return file
    const { width, height } = targetSize(w, h, maxDim)

    const canvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement('canvas'), { width, height })
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    // PNGs with transparency would turn black in JPEG; paint white underneath.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(src, 0, 0, width, height)
    if (typeof src.close === 'function') src.close()

    let blob = await canvasToBlob(canvas, WEBP, quality)
    if (!blob || blob.type !== WEBP) blob = await canvasToBlob(canvas, JPEG, quality)
    if (!blob) return file
    // Only keep the new version if it is actually smaller.
    if (blob.size >= file.size) return file

    const ext = blob.type === WEBP ? 'webp' : 'jpg'
    const base = (file.name || 'image').replace(/\.[^.]+$/, '')
    return new File([blob], `${base}.${ext}`, { type: blob.type, lastModified: Date.now() })
  } catch {
    return file
  }
}

export const __test__ = { targetSize }
