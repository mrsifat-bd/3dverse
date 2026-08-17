// bKash Transaction ID — FORMAT validation only.
//
// IMPORTANT: this checks the *format* of the ID the customer typed. It does NOT
// verify that a payment was actually received. A format-valid ID means only
// "this looks like a bKash Transaction ID" — never "the payment is verified".
// Real payment verification is done manually by an admin. We never call bKash.
//
// bKash Transaction IDs are short uppercase alphanumeric codes (real ones are
// typically 10 characters, e.g. "8N7A2B3C4D"). We accept 8–12 uppercase
// alphanumeric characters to stay tolerant of minor variations without letting
// through obviously-bogus input like "123", "hello" or "ABC@123#".
export const BKASH_TXN_REGEX = /^[A-Z0-9]{8,12}$/

// Normalise before validating/storing: trim, strip inner spaces, uppercase.
export function normalizeBkashTxnId(value) {
  return String(value ?? '').trim().replace(/\s+/g, '').toUpperCase()
}

// Returns { ok, value, error } where `value` is the normalised ID.
// This is pure and shared by the frontend (feedback) and backend (enforcement).
export function validateBkashTransactionId(value) {
  const v = normalizeBkashTxnId(value)
  if (!v) return { ok: false, value: '', error: 'Please enter your bKash Transaction ID.' }
  if (!BKASH_TXN_REGEX.test(v)) return { ok: false, value: v, error: 'Please enter a valid bKash Transaction ID.' }
  return { ok: true, value: v, error: '' }
}

// The affirmative message to show when the format passes. Deliberately worded so
// it can never be mistaken for "payment verified" / "payment successful".
export const BKASH_FORMAT_OK_MESSAGE = 'Transaction ID format looks valid.'
