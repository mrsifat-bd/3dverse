import { describe, it, expect } from 'vitest'
import { splitTarget, arrangeCategories, MEDICAL_PRODUCT_SLUGS, CATEGORY_REDIRECTS, OLD_CATEGORY } from '../categorySplit'

describe('Medical / Bones split', () => {
  it('sends the 11 owner-chosen products to Medical and the rest to Bones', () => {
    expect(MEDICAL_PRODUCT_SLUGS).toHaveLength(11)
    expect(new Set(MEDICAL_PRODUCT_SLUGS).size).toBe(11)
    for (const s of MEDICAL_PRODUCT_SLUGS) expect(splitTarget(s)).toBe('medical')
    for (const s of ['femur', 'full-set-bones', 'half-set-bones', 'human-skull-full', 'mini-skeleton', 'articulated-skeleton-full-body', 'atlas-c1-vertebra'])
      expect(splitTarget(s)).toBe('bones')
  })
  it('redirects the old category to Bones and never lists it', () => {
    expect(CATEGORY_REDIRECTS[OLD_CATEGORY]).toBe('bones')
    const cats = [{ slug: 'pen-holder' }, { slug: OLD_CATEGORY }, { slug: 'bones' }, { slug: 'gifts' }, { slug: 'medical' }]
    expect(arrangeCategories(cats).map((c) => c.slug)).toEqual(['medical', 'bones', 'pen-holder', 'gifts'])
  })
  it('keeps other categories in their order when Medical/Bones are missing', () => {
    expect(arrangeCategories([{ slug: 'b' }, { slug: 'a' }]).map((c) => c.slug)).toEqual(['b', 'a'])
  })
})

describe('preview mode (flag set only on Vercel Preview)', () => {
  it('shows old-category products in Medical/Bones and adds the two categories with counts', async () => {
    const { vi } = await import('vitest')
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_CATEGORY_SPLIT_PREVIEW', '1')
    const m = await import('../categorySplit')
    expect(m.PREVIEW_SPLIT).toBe(true)
    const products = [
      { slug: 'human-heart', category: 'medical-bone-models', extra_categories: [] },
      { slug: 'femur', category: 'medical-bone-models', extra_categories: [] },
      { slug: 'pen', category: 'pen-holder', extra_categories: ['medical-bone-models'] },
    ].map(m.previewProduct)
    expect(products.map((p) => p.category)).toEqual(['medical', 'bones', 'pen-holder'])
    expect(products[2].extra_categories).toEqual(['bones'])
    const cats = m.arrangeCategories([{ slug: 'pen-holder', product_count: 1 }, { slug: 'medical-bone-models', product_count: 3 }], products)
    expect(cats.map((c) => [c.slug, c.product_count])).toEqual([['medical', 1], ['bones', 2], ['pen-holder', 1]])
    vi.unstubAllEnvs()
    vi.resetModules()
  })
  it('production (no flag) leaves products untouched', async () => {
    const m = await import('../categorySplit')
    const p = { slug: 'femur', category: 'medical-bone-models' }
    expect(m.previewProduct(p)).toBe(p)
  })
})
