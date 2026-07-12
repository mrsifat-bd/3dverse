import { describe, it, expect } from 'vitest'
import { buildWhatsappOrderUrl } from '../whatsapp'
import { BUSINESS } from '../config'

const product = { name: 'Human Skull Model', slug: 'human-skull-model', price: 1200 }

describe('buildWhatsappOrderUrl', () => {
  it('targets the correct wa.me number', () => {
    const url = buildWhatsappOrderUrl(product)
    expect(url.startsWith(`https://wa.me/${BUSINESS.whatsappNumber}?text=`)).toBe(true)
  })

  it('URL-encodes the Bangla message with product details', () => {
    const url = buildWhatsappOrderUrl(product)
    const text = decodeURIComponent(url.split('text=')[1])
    expect(text).toContain('প্রোডাক্ট: Human Skull Model')
    expect(text).toContain('মূল্য: ৳1,200')
    expect(text).toContain('/product/human-skull-model')
  })

  it('produces a fully encoded query (no raw spaces)', () => {
    const url = buildWhatsappOrderUrl(product)
    expect(url).not.toContain(' ')
  })
})
