import { describe, expect, it } from 'vitest'
import { objectPathFromUrl, objectPathFor, publicUrlFor, variantFolder } from '@/lib/storage-paths'

const BASE = 'https://ykfuevyqpjvtxidjnhxm.supabase.co'
const PUBLIC = `${BASE}/storage/v1/object/public/images`

describe('objectPathFromUrl', () => {
  it('strips the ?v= cache-buster every stored URL carries', () => {
    expect(
      objectPathFromUrl(`${PUBLIC}/outfit_variants/moonlit-hair/image_url.webp?v=1786140993123`)
    ).toBe('outfit_variants/moonlit-hair/image_url.webp')
  })

  it('handles a URL with no query string', () => {
    expect(objectPathFromUrl(`${PUBLIC}/outfit_variants/moonlit-hair/alt_image_url.webp`)).toBe(
      'outfit_variants/moonlit-hair/alt_image_url.webp'
    )
  })

  it('decodes percent-encoded segments', () => {
    expect(objectPathFromUrl(`${PUBLIC}/outfit_variants/a%20b-hair/image_url.webp`)).toBe(
      'outfit_variants/a b-hair/image_url.webp'
    )
  })

  it('returns null for a non-storage URL', () => {
    expect(objectPathFromUrl('https://example.com/nope.webp')).toBeNull()
  })

  it('returns null for a malformed URL', () => {
    expect(objectPathFromUrl('not-a-url')).toBeNull()
  })
})

describe('variantFolder / objectPathFor', () => {
  it('builds the folder from table and slug', () => {
    expect(variantFolder('outfit_variants', 'moonlit-hair')).toBe('outfit_variants/moonlit-hair')
  })

  it('builds a full object path per column', () => {
    expect(objectPathFor('makeup_variants', 'glow-lips', 'alt_image_url')).toBe(
      'makeup_variants/glow-lips/alt_image_url.webp'
    )
  })
})

describe('publicUrlFor', () => {
  it('builds a public URL with a fresh cache-buster', () => {
    const url = publicUrlFor(BASE, 'outfit_variants/moonlit-hair/image_url.webp')
    expect(url.startsWith(`${PUBLIC}/outfit_variants/moonlit-hair/image_url.webp?v=`)).toBe(true)
  })

  it('round-trips with objectPathFromUrl', () => {
    const path = 'outfit_variants/moonlit-hair/image_url.webp'
    expect(objectPathFromUrl(publicUrlFor(BASE, path))).toBe(path)
  })
})
