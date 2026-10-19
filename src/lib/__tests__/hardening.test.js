import { describe, it, expect } from 'vitest'
import { orderErrorKey } from '../orderErrors'
import { clampQty, MAX_QTY } from '../cart'

describe('order error mapping for the hardened database', () => {
  it('maps rate limits and quantity/item errors to friendly translated keys', () => {
    expect(orderErrorKey('RATE_LIMITED')).toBe('checkout.rateLimited')
    expect(orderErrorKey('INVALID_QUANTITY')).toBe('checkout.quantityInvalid')
    expect(orderErrorKey('INVALID_ITEMS: too many lines')).toBe('checkout.cartProblem')
  })
  it('never shows raw technical text', () => {
    expect(orderErrorKey('permission denied for function x')).toBe('checkout.failed')
  })
})

describe('cart quantity clamp (same ceiling as place_order)', () => {
  it('keeps whole numbers between 1 and 1000', () => {
    expect(MAX_QTY).toBe(1000)
    expect(clampQty(20)).toBe(20)
    expect(clampQty('50')).toBe(50)
    expect(clampQty(0)).toBe(1)
    expect(clampQty(-4)).toBe(1)
    expect(clampQty(2.6)).toBe(3)
    expect(clampQty(5000)).toBe(1000)
    expect(clampQty('abc')).toBe(1)
  })
})
