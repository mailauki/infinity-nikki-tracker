import { describe, expect, it } from 'vitest'
import { thumbPath, thumbnailSrc } from '@/lib/image-transform'

const BUCKET = 'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/images'
const ORIGINAL = `${BUCKET}/outfit_variants/silverplume-hair/image_url.webp`
const THUMB = `${BUCKET}/outfit_variants/silverplume-hair/image_url.thumb.webp`

describe('thumbnailSrc', () => {
  it('points a public images-bucket WebP at its .thumb.webp sibling', () => {
    expect(thumbnailSrc(ORIGINAL)).toBe(THUMB)
  })

  it('carries the ?v= cache-buster over to the thumbnail', () => {
    expect(thumbnailSrc(`${ORIGINAL}?v=1783910545045`)).toBe(`${THUMB}?v=1783910545045`)
  })

  it('leaves a URL with any other query alone', () => {
    const odd = `${ORIGINAL}?token=abc`
    expect(thumbnailSrc(odd)).toBe(odd)
  })

  it('leaves non-WebP and already-thumbnail objects alone', () => {
    const png = `${BUCKET}/a/image_url.png`
    expect(thumbnailSrc(png)).toBe(png)
    expect(thumbnailSrc(THUMB)).toBe(THUMB)
  })

  it('leaves other buckets, local paths, blob: and data: URIs alone', () => {
    const avatar =
      'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/avatars/u1/avatar.webp'
    for (const src of [
      avatar,
      '/icons/categories/blue.png',
      'blob:http://localhost/abc',
      'data:image/webp;base64,AAA',
      'https://example.test/a.webp',
    ]) {
      expect(thumbnailSrc(src)).toBe(src)
    }
  })
})

describe('thumbPath', () => {
  it('maps an object path to its thumbnail path', () => {
    expect(thumbPath('outfit_variants/x/image_url.webp')).toBe(
      'outfit_variants/x/image_url.thumb.webp'
    )
  })
})
