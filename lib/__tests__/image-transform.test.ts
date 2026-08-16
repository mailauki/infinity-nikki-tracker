import { beforeEach, describe, expect, it } from 'vitest'
import {
  reportTransformFailure,
  resetTransformAvailability,
  thumbnailSrc,
} from '@/lib/image-transform'

const STORAGE = 'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1'
const OBJECT = `${STORAGE}/object/public/images/outfit_variants/silverplume-hair/image_url.png`
const RENDER = `${STORAGE}/render/image/public/images/outfit_variants/silverplume-hair/image_url.png`

describe('thumbnailSrc', () => {
  beforeEach(() => {
    resetTransformAvailability()
  })

  it('rewrites a public storage object to the resize endpoint at 2x the box', () => {
    expect(thumbnailSrc(OBJECT, 40)).toBe(`${RENDER}?width=80&height=80&resize=cover&quality=75`)
  })

  it('leaves local icon paths alone', () => {
    expect(thumbnailSrc('/icons/categories/blue.png', 24)).toBe('/icons/categories/blue.png')
  })

  it('leaves object URLs and data URIs alone', () => {
    expect(thumbnailSrc('blob:http://localhost/abc', 40)).toBe('blob:http://localhost/abc')
    expect(thumbnailSrc('data:image/png;base64,AAA', 40)).toBe('data:image/png;base64,AAA')
  })

  it('leaves a URL that already carries query params alone', () => {
    // Signed URLs and anything already parameterized: rewriting the path would
    // invalidate the token, and appending would fight the existing params.
    const signed = `${STORAGE}/object/sign/images/a.png?token=abc`
    expect(thumbnailSrc(signed, 40)).toBe(signed)
  })

  it('leaves URLs from other hosts alone', () => {
    expect(thumbnailSrc('https://example.test/a.png', 40)).toBe('https://example.test/a.png')
  })

  it('stops rewriting once a transform has been reported as unavailable', () => {
    expect(thumbnailSrc(OBJECT, 40)).not.toBe(OBJECT)
    reportTransformFailure()
    expect(thumbnailSrc(OBJECT, 40)).toBe(OBJECT)
  })
})
