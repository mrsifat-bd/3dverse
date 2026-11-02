// SERVER ONLY. Writes a natural Bangla product name + description from the
// English text, using Google Gemini (free tier). The key stays server-side.
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

export function banglaWriterConfigured() {
  return Boolean(process.env.GEMINI_API_KEY)
}

export function buildPrompt({ name, description, category }) {
  return [
    'You write product text for 3D Verse BD, a 3D printing shop in Sylhet, Bangladesh that delivers nationwide.',
    'Rewrite the product below in natural, warm, easy Bangla the way a Bangladeshi shop owner would write it for customers.',
    'Rules:',
    '- Write it as fresh Bangla copy, not a word-by-word translation; it must read like a real person wrote it.',
    '- Keep every fact from the English. Do NOT add facts, materials, sizes, uses, guarantees or claims that are not in the English.',
    '- Keep medical/anatomy terms correct. Where Bangladeshi students normally use the English term (e.g. Mandible, Vertebra, Skull), keep it in English inside the Bangla sentence.',
    '- Use Bangla digits only for prices or numbers that appear in the English.',
    '- No emoji, no markdown, no hashtags, no headings. Short paragraphs separated by a blank line are fine.',
    '- name_bn: a short Bangla product name (keep brand/model names as they are).',
    'Return only JSON: {"name_bn": "...", "description_bn": "..."}',
    '',
    `Category: ${String(category || '').slice(0, 80)}`,
    `English name: ${String(name || '').slice(0, 200)}`,
    `English description:\n${String(description || '').slice(0, 4000)}`,
  ].join('\n')
}

export async function writeBangla({ name, description, category }, { timeoutMs = 30000 } = {}) {
  if (!banglaWriterConfigured()) return { ok: false, status: 503, error: 'GEMINI_API_KEY is not set on the server.' }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildPrompt({ name, description, category }) }] }],
        generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
      }),
      signal: controller.signal,
      cache: 'no-store',
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const msg = data?.error?.message || `Gemini error (HTTP ${res.status}).`
      return { ok: false, status: res.status === 429 ? 429 : 502, error: res.status === 429 ? 'Free Gemini limit reached for now. Try again in a minute.' : msg }
    }
    const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim()
    let out
    try { out = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '')) } catch { return { ok: false, status: 502, error: 'Gemini returned an unexpected answer. Please try again.' } }
    const name_bn = String(out?.name_bn || '').trim().slice(0, 200)
    const description_bn = String(out?.description_bn || '').replace(/\r/g, '').trim().slice(0, 6000)
    if (!description_bn || !/[ঀ-৿]/.test(description_bn)) return { ok: false, status: 502, error: 'No Bangla text came back. Please try again.' }
    return { ok: true, name_bn, description_bn }
  } catch (e) {
    return { ok: false, status: 504, error: e?.name === 'AbortError' ? 'Gemini took too long. Please try again.' : 'Could not reach Gemini.' }
  } finally {
    clearTimeout(timer)
  }
}
