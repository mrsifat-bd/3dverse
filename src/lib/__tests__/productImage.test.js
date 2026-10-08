// @vitest-environment node
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { cardImage } from '../format'
import { processProductImage, sniffImageType, ImageRejectedError, OUTPUT_MAX_SIDE } from '../server/productImage'

const EXIF = {
  IFD0: { Make: 'TestCam', Model: 'Model X', Software: 'EditorPro 9', DateTime: '2024:01:02 03:04:05', Artist: 'Someone' },
  IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '24/1 53/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '91/1 52/1 0/1' },
}

function photo(w, h, { alpha = false } = {}) {
  return sharp({ create: { width: w, height: h, channels: alpha ? 4 : 3, background: alpha ? { r: 200, g: 80, b: 40, alpha: 0.5 } : { r: 200, g: 80, b: 40 } } })
}

async function expectClean(buf) {
  const m = await sharp(buf).metadata()
  expect(m.format).toBe('webp')
  expect(m.exif).toBeUndefined()
  expect(m.icc).toBeUndefined()
  expect(m.xmp).toBeUndefined()
  expect(m.iptc).toBeUndefined()
  // No camera/GPS/software strings anywhere in the file bytes.
  const raw = buf.toString('latin1')
  for (const s of ['TestCam', 'Model X', 'EditorPro', 'Someone', 'GPS', 'Exif', 'XMP ']) expect(raw).not.toContain(s)
  return m
}

describe('cardImage()', () => {
  it('maps processed images to their -640 variant and leaves others alone', () => {
    const u = 'https://x.supabase.co/storage/v1/object/public/product-images/products/0123456789abcdef0123456789abcdef.webp'
    expect(cardImage(u)).toBe(u.replace('.webp', '-640.webp'))
    expect(cardImage('/img/medical.svg')).toBe('/img/medical.svg')
    expect(cardImage('https://old.supabase.co/storage/v1/object/public/product-images/1712-abc.jpg')).toContain('1712-abc.jpg')
    expect(cardImage(null)).toBe(null)
  })
})

describe('product image pipeline', () => {
  it('converts a JPEG with camera + GPS EXIF to clean WebP', async () => {
    const jpg = await photo(3000, 2000).withExif(EXIF).jpeg({ quality: 90 }).toBuffer()
    expect((await sharp(jpg).metadata()).exif).toBeDefined() // input really has EXIF
    const out = await processProductImage(jpg)
    expect(out.contentType).toBe('image/webp')
    expect(out.path).toMatch(/^products\/[0-9a-f]{32}\.webp$/)
    const m = await expectClean(out.data)
    expect(Math.max(m.width, m.height)).toBe(OUTPUT_MAX_SIDE)
  })

  it('also produces a clean 640px card variant next to the full image', async () => {
    const jpg = await photo(3000, 2000).withExif(EXIF).jpeg({ quality: 90 }).toBuffer()
    const out = await processProductImage(jpg)
    expect(out.card.path).toBe(out.path.replace('.webp', '-640.webp'))
    const m = await expectClean(out.card.data)
    expect(Math.max(m.width, m.height)).toBe(640)
    expect(out.card.bytes).toBeLessThan(out.bytes)
  })

  it('applies EXIF orientation before stripping it (portrait stays portrait)', async () => {
    const jpg = await photo(400, 200).withMetadata({ orientation: 6 }).jpeg().toBuffer()
    const out = await processProductImage(jpg)
    expect(out.width).toBe(200)
    expect(out.height).toBe(400)
  })

  it('handles PNG with transparency and keeps alpha', async () => {
    const png = await photo(800, 600, { alpha: true }).png().toBuffer()
    const out = await processProductImage(png)
    const m = await expectClean(out.data)
    expect(m.hasAlpha).toBe(true)
    expect(out.width).toBe(800) // never upscaled
  })

  it('re-encodes WebP input and strips its metadata', async () => {
    const webp = await photo(1200, 1200).withExif(EXIF).webp().toBuffer()
    const out = await processProductImage(webp)
    await expectClean(out.data)
  })

  it('gives identical uploads the same stable path (no duplicates)', async () => {
    const jpg = await photo(500, 500).jpeg().toBuffer()
    const a = await processProductImage(jpg)
    const b = await processProductImage(jpg)
    expect(a.path).toBe(b.path)
  })

  it('rejects a non-image renamed to .jpg', async () => {
    await expect(processProductImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).rejects.toBeInstanceOf(ImageRejectedError)
  })

  it('rejects GIF and other unsupported formats', async () => {
    const gif = await photo(100, 100).gif().toBuffer()
    await expect(processProductImage(gif)).rejects.toThrow(/not a JPG, PNG or WebP/)
  })

  it('rejects a truncated / corrupted JPEG', async () => {
    const jpg = await photo(1000, 1000).jpeg().toBuffer()
    await expect(processProductImage(jpg.subarray(0, Math.floor(jpg.length / 3)))).rejects.toBeInstanceOf(ImageRejectedError)
  })

  it('rejects tiny images', async () => {
    const png = await photo(20, 20).png().toBuffer()
    await expect(processProductImage(png)).rejects.toThrow(/too small/)
  })

  it('rejects decompression bombs (huge dimensions, tiny file)', async () => {
    const bomb = await sharp({ create: { width: 15000, height: 15000, channels: 3, background: '#fff' } }).png({ compressionLevel: 9 }).toBuffer()
    expect(bomb.length).toBeLessThan(4 * 1024 * 1024)
    await expect(processProductImage(bomb)).rejects.toBeInstanceOf(ImageRejectedError)
  })

  it('rejects files over the upload limit before decoding', async () => {
    await expect(processProductImage(Buffer.alloc(5 * 1024 * 1024, 0xff))).rejects.toMatchObject({ status: 413 })
  })

  it('sniffs real types from bytes', () => {
    expect(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe('jpeg')
    expect(sniffImageType(Buffer.from('RIFF0000WEBPVP8 '))).toBe('webp')
    expect(sniffImageType(Buffer.from('GIF89a000000'))).toBe(null)
  })
})
