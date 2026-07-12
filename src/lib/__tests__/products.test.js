import { describe, it, expect } from 'vitest'
import { searchProducts, sortProducts } from '../products'
import { formatPrice, slugify } from '../format'

const sample = [
  { id: '1', name: 'Skull', description: 'anatomy model', category: 'bone-models', tags: ['skull'], price: 1200, created_at: '2026-01-01' },
  { id: '2', name: 'Keyring', description: 'custom gift', category: 'keyrings', tags: ['name'], price: 150, created_at: '2026-02-01' },
  { id: '3', name: 'Planter', description: 'home decor', category: 'home-decor', tags: ['plant'], price: 450, created_at: '2026-03-01' },
]

describe('searchProducts', () => {
  it('matches on name', () => {
    expect(searchProducts(sample, 'skull')).toHaveLength(1)
  })
  it('matches on tag and category', () => {
    expect(searchProducts(sample, 'keyrings')[0].id).toBe('2')
    expect(searchProducts(sample, 'plant')[0].id).toBe('3')
  })
  it('returns all when query empty', () => {
    expect(searchProducts(sample, '')).toHaveLength(3)
  })
})

describe('sortProducts', () => {
  it('sorts by price ascending and descending', () => {
    expect(sortProducts(sample, 'price-asc').map((p) => p.price)).toEqual([150, 450, 1200])
    expect(sortProducts(sample, 'price-desc').map((p) => p.price)).toEqual([1200, 450, 150])
  })
  it('sorts by newest by default', () => {
    expect(sortProducts(sample, 'newest')[0].id).toBe('3')
  })
})

describe('format helpers', () => {
  it('formats BDT price', () => {
    expect(formatPrice(1200)).toBe('৳1,200')
  })
  it('slugifies text', () => {
    expect(slugify('Human Skull Model!')).toBe('human-skull-model')
  })
})
