import { describe, expect, it } from 'vitest'
import { actionFor, isCollectible } from '@/lib/search/obtained'

const base = {
  title: 'X',
  subtitle: 'head',
  image_url: null,
  parent_slug: 'moon',
  filter_value: null,
  obtained: false,
  rank: 1,
}

describe('isCollectible', () => {
  it('is true for the four collectible kinds', () => {
    expect(isCollectible({ ...base, kind: 'outfit_piece', slug: 'a' })).toBe(true)
    expect(
      isCollectible({ ...base, kind: 'eureka_variant', slug: 'a', filter_value: 'blue' })
    ).toBe(true)
    expect(isCollectible({ ...base, kind: 'makeup_variant', slug: 'a' })).toBe(true)
    expect(isCollectible({ ...base, kind: 'momo_cloak', slug: 'a' })).toBe(true)
  })

  // A season has no obtained state -- it must render no toggle at all.
  it('is false for a non-collectible kind', () => {
    expect(isCollectible({ ...base, kind: 'season', slug: 'a' })).toBe(false)
  })
})

describe('actionFor', () => {
  it('maps an outfit piece to the outfit action', () => {
    expect(actionFor({ ...base, kind: 'outfit_piece', slug: 'pin' })).toEqual({
      fn: 'outfit',
      args: ['moon', 'head', 'pin'],
    })
  })

  // Eureka keys on the bare color, not the slug -- same reason routing does.
  it('maps a eureka variant to the eureka action keyed on filter_value', () => {
    expect(
      actionFor({ ...base, kind: 'eureka_variant', slug: 'moon-head-blue', filter_value: 'blue' })
    ).toEqual({
      fn: 'eureka',
      args: ['moon', 'head', 'blue'],
    })
  })

  it('maps a makeup variant to the makeup action', () => {
    expect(actionFor({ ...base, kind: 'makeup_variant', slug: 'pin' })).toEqual({
      fn: 'makeup',
      args: ['moon', 'head', 'pin'],
    })
  })

  it('maps a momo cloak to the momo cloak action, keyed on slug alone', () => {
    expect(actionFor({ ...base, kind: 'momo_cloak', slug: 'cozy' })).toEqual({
      fn: 'momoCloak',
      args: ['cozy'],
    })
  })

  it('returns null for a non-collectible kind', () => {
    expect(actionFor({ ...base, kind: 'season', slug: 'a' })).toBeNull()
  })

  it('returns null for an outfit piece with no parent_slug', () => {
    expect(actionFor({ ...base, kind: 'outfit_piece', slug: 'a', parent_slug: null })).toBeNull()
  })

  it('returns null for a eureka variant with no filter_value', () => {
    expect(actionFor({ ...base, kind: 'eureka_variant', slug: 'a', filter_value: null })).toBeNull()
  })
})
