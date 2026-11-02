// @vitest-environment node
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { writeBangla, buildPrompt } from '@/lib/banglaWriter'

let reply, sent
beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key'
  delete process.env.GEMINI_MODEL
  reply = { status: 200, body: { candidates: [{ content: { parts: [{ text: '{"name_bn":"ম্যান্ডিবল মডেল","description_bn":"৩ডি প্রিন্ট করা Mandible মডেল, পড়ার জন্য একদম উপযোগী।"}' }] } }] } }
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    sent = { url: String(url), headers: init.headers, body: JSON.parse(init.body) }
    return new Response(JSON.stringify(reply.body), { status: reply.status, headers: { 'Content-Type': 'application/json' } })
  }))
})
afterEach(() => vi.unstubAllGlobals())

describe('Bangla description writer (Gemini)', () => {
  it('returns Bangla name and description; key stays in a header', async () => {
    const r = await writeBangla({ name: 'Mandible', description: '3D printed mandible model for study.', category: 'Medical' })
    expect(r).toEqual({ ok: true, name_bn: 'ম্যান্ডিবল মডেল', description_bn: '৩ডি প্রিন্ট করা Mandible মডেল, পড়ার জন্য একদম উপযোগী।' })
    expect(sent.url).toContain('/models/gemini-2.5-flash:generateContent')
    expect(sent.url).not.toContain('test-key')
    expect(sent.headers['x-goog-api-key']).toBe('test-key')
    expect(sent.body.generationConfig.responseMimeType).toBe('application/json')
  })
  it('prompt forbids invented facts and keeps the English text', () => {
    const p = buildPrompt({ name: 'Skull', description: 'Life size skull.', category: 'Medical' })
    expect(p).toMatch(/Do NOT add facts/)
    expect(p).toContain('Life size skull.')
  })
  it('clear errors: missing key, rate limit, non-Bangla answer', async () => {
    delete process.env.GEMINI_API_KEY
    expect((await writeBangla({ description: 'x x x x x x' })).error).toMatch(/GEMINI_API_KEY/)
    process.env.GEMINI_API_KEY = 'k'
    reply = { status: 429, body: { error: { message: 'quota' } } }
    expect((await writeBangla({ description: 'x x x x x x' })).error).toMatch(/limit/)
    reply = { status: 200, body: { candidates: [{ content: { parts: [{ text: '{"name_bn":"x","description_bn":"English only"}' }] } }] } }
    expect((await writeBangla({ description: 'x x x x x x' })).ok).toBe(false)
  })
})
