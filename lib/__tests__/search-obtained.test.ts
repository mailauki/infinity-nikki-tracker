import { describe, expect, it } from 'vitest'
import { actionFor, isCollectible } from '@/lib/search/obtained'

const base = {
  title: 'X',
  subtitle: 'head',
  image_url: null,
  parent_slug: 'moon',
  filter_value: null,
  filter_category: null,
  obtained: false,
  rank: 1,
}

// A eureka variant as the view ACTUALLY emits it: subtitle is the parent SET
// TITLE, and the bare category lives in filter_category. The old fixtures put
// 'head' in subtitle -- a value the real view never produces for eureka -- which
// is exactly why the previously green tests missed the junk-row bug.
const eureka = {
  ...base,
  kind: 'eureka_variant',
  slug: 'masked_magic-head-red',
  subtitle: 'Masked Magic',
  parent_slug: 'masked_magic',
  filter_value: 'red',
  filter_category: 'head',
} as const

describe('isCollectible', () => {
  it('is true for the four collectible kinds', () => {
    expect(isCollectible({ ...base, kind: 'outfit_piece', slug: 'a' })).toBe(true)
    expect(isCollectible(eureka)).toBe(true)
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

  // Eureka keys on the bare color, not the slug -- same reason routing does --
  // and on filter_category, NOT subtitle. obtained_eureka.category only ever
  // holds head/hands/feet, so passing the subtitle ('Masked Magic') would write
  // a junk row that never reads back as obtained.
  it('maps a eureka variant to the eureka action keyed on color and category', () => {
    expect(actionFor(eureka)).toEqual({
      fn: 'eureka',
      args: ['masked_magic', 'head', 'red'],
    })
  })

  // The regression guard: the set title must never reach the category argument.
  it('never passes a eureka subtitle as the category', () => {
    const action = actionFor(eureka)
    expect(action?.args).not.toContain('Masked Magic')
  })

  it('returns null for a eureka variant with no filter_category', () => {
    expect(actionFor({ ...eureka, filter_category: null })).toBeNull()
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
    expect(actionFor({ ...eureka, filter_value: null })).toBeNull()
  })
})
