import { describe, expect, it } from 'vitest'
import { SEARCH_KINDS } from '@/lib/search/types'
import { destinationFor } from '@/lib/search/routing'

const base = {
  title: 'X',
  subtitle: null,
  image_url: null,
  parent_slug: null,
  filter_value: null,
  filter_category: null,
  obtained: null,
  rank: 1,
}

describe('destinationFor', () => {
  it('sends a set to its own page', () => {
    expect(destinationFor({ ...base, kind: 'outfit_set', slug: 'moon' })).toBe('/outfits/moon')
  })

  // The set page reads ?evolution= as a SUFFIX and rebuilds `{set}-{param}`,
  // so only the suffix may travel. Passing the whole slug produced
  // `dustwoven_tribute-dustwoven_tribute-expedition`, which matched nothing.
  it('sends an evolution to its parent set with only the slug suffix', () => {
    expect(
      destinationFor({
        ...base,
        kind: 'outfit_evolution',
        slug: 'dustwoven_tribute-expedition',
        parent_slug: 'dustwoven_tribute',
      })
    ).toBe('/outfits/dustwoven_tribute?evolution=expedition')
  })

  // Defensive: an evolution whose slug is not `{parent}-{suffix}` has no
  // suffix to send, so it falls back to the bare set page rather than
  // emitting a param the page would resolve to a nonexistent evolution.
  it('omits the param when an evolution slug lacks the parent prefix', () => {
    expect(
      destinationFor({
        ...base,
        kind: 'outfit_evolution',
        slug: 'unrelated-expedition',
        parent_slug: 'dustwoven_tribute',
      })
    ).toBe('/outfits/dustwoven_tribute')
  })

  // A piece is a variant (`{set}-{category}`), not an evolution state, and no
  // piece-highlighting param exists -- so it gets the plain parent set URL.
  it('sends a piece to its parent set with no param', () => {
    expect(
      destinationFor({
        ...base,
        kind: 'outfit_piece',
        slug: 'blossoming_future-heart_voice-earrings',
        parent_slug: 'blossoming_future',
      })
    ).toBe('/outfits/blossoming_future')
  })

  // Makeup variants are variants too, and makeup evolution slugs are opaque
  // rather than parent-prefixed -- a variant slug never names one.
  it('sends a makeup variant to its parent set with no param', () => {
    expect(
      destinationFor({ ...base, kind: 'makeup_variant', slug: 'moon-lips', parent_slug: 'moon' })
    ).toBe('/makeup/moon')
  })

  it('sends a profile to its username path', () => {
    expect(destinationFor({ ...base, kind: 'profile', slug: 'julie' })).toBe('/u/julie')
  })

  // The motivating case: a claimed color facet narrows the eureka destination.
  it('attaches a color facet to a eureka destination', () => {
    expect(
      destinationFor({ ...base, kind: 'eureka_set', slug: 'moon' }, [
        { type: 'color', value: 'iridescent', label: 'Iridescent' },
      ])
    ).toBe('/eureka/moon?color=iridescent')
  })

  // A facet that means nothing to this destination is dropped, not appended
  // as a dead param the page would ignore anyway.
  it('drops a facet that is meaningless for the destination', () => {
    expect(
      destinationFor({ ...base, kind: 'season', slug: 'winter' }, [
        { type: 'color', value: 'iridescent', label: 'Iridescent' },
      ])
    ).toBe('/seasons/winter')
  })

  // Guard: a newly indexed table must not silently produce dead rows.
  it('has a routing decision for every kind', () => {
    for (const kind of SEARCH_KINDS) {
      const dest = destinationFor({ ...base, kind, slug: 's', parent_slug: 'p' })
      expect(dest === null || dest.startsWith('/')).toBe(true)
    }
  })
})
