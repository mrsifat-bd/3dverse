import { describe, it, expect } from 'vitest'
import { __test__, compressImage } from '../imageCompress'

const { targetSize } = __test__

describe('imageCompress', () => {
  it('scales the long edge down to maxDim and keeps aspect ratio', () => {
    expect(targetSize(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 })
    expect(targetSize(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 })
  })

  it('never upscales small images', () => {
    expect(targetSize(800, 600, 1600)).toEqual({ width: 800, height: 600 })
  })

  it('returns the original file when it cannot be processed', async () => {
    const f = new File(['not really an image'], 'x.gif', { type: 'image/gif' })
    expect(await compressImage(f)).toBe(f)
  })
})
