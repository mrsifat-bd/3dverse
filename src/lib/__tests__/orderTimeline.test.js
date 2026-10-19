import { describe, it, expect } from 'vitest'
import { getT } from '../../i18n'
import { customerEvent, courierLabel } from '../orderTimeline'

const en = getT('en')
const bn = getT('bn')

describe('customer order timeline', () => {
  it('translates known database messages into Bangla, keeping factual values', () => {
    expect(customerEvent({ type: 'created', message: 'Order placed. bKash txn ABC12345 — awaiting manual verification.' }, bn).text).toContain('ABC12345')
    expect(customerEvent({ type: 'created', message: 'Order placed. bKash txn ABC12345 — awaiting manual verification.' }, bn).text).toMatch(/[ঀ-৿]/)
    expect(customerEvent({ type: 'status', message: 'Status set to Shipped' }, bn).text).toBe('অবস্থা: ' + bn('orders.status.shipped'))
    expect(customerEvent({ type: 'status', message: 'Payment rejected by admin (pending → rejected): Txn not found' }, en).text).toBe('Payment could not be verified: Txn not found')
    expect(customerEvent({ type: 'status', message: 'Cancelled by the customer before verification.' }, en).text).toBe('You cancelled this order.')
    expect(customerEvent({ type: 'shipment_created', message: 'Steadfast parcel created — CID 123, tracking TRK999' }, bn).text).toContain('TRK999')
  })
  it('hides internal errors from customers', () => {
    expect(customerEvent({ type: 'error', message: 'Steadfast parcel creation failed: 401 bad key' }, en)).toBeNull()
    expect(customerEvent({ type: 'status', message: 'Steadfast parcel creation failed: timeout' }, en)).toBeNull()
  })
  it('shows unknown messages unchanged and marked as English', () => {
    expect(customerEvent({ type: 'status', message: 'Something new' }, bn)).toEqual({ text: 'Something new', lang: 'en' })
  })
  it('translates courier status labels with a safe fallback', () => {
    expect(courierLabel(bn, 'in_review')).toBe('যাচাই চলছে')
    expect(courierLabel(bn, 'Partially delivered')).toBe('আংশিক ডেলিভারি')
    expect(courierLabel(bn, null)).toBe('এখনো তৈরি হয়নি')
    expect(courierLabel(en, 'brand_new_state')).toBe('brand_new_state')
  })
})
