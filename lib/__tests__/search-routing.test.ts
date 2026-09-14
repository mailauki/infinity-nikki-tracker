import { describe, expect, it } from 'vitest'
import { SEARCH_KINDS } from '@/lib/search/types'
import { destinationFor } from '@/lib/search/routing'

const base = {
  title: 'X',
  subtitle: null,
  image_url: null,
  parent_slug: null,
  filter_value: null,
  obtained: null,
  rank: 1,
}

describe('destinationFor', () => {
  it('sends a set to its own page', () => {
    expect(destinationFor({ ...base, kind: 'outfit_set', slug: 'moon' })).toBe('/outfits/moon')
  })

  // Evolutions and pieces have no page of their own -- they resolve to the
  // parent set, reusing the ?evolution= param that page already reads.
  it('sends a piece to its parent set with the evolution param', () => {
    expect(
      destinationFor({ ...base, kind: 'outfit_piece', slug: 'hairpin', parent_slug: 'moon' })
    ).toBe('/outfits/moon?evolution=hairpin')
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
