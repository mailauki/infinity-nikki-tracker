import { describe, expect, it } from 'vitest'
import { claimFacets, type FacetVocabulary } from '@/lib/search/facets'
import { normalizeQuery } from '@/lib/search/query'

const vocabulary: FacetVocabulary = {
  style: [{ value: 'sweet', label: 'Sweet' }],
  label: [],
  ability: [],
  location: [],
  color: [{ value: 'iridescent', label: 'Iridescent' }],
  category: [{ value: 'dress', label: 'Dress' }],
}

describe('claimFacets', () => {
  // The motivating case: a set name plus an attribute.
  it('claims a color term and leaves the rest as the entity query', () => {
    const { facets, remainder } = claimFacets('moon iridescent', vocabulary)
    expect(facets).toEqual([{ type: 'color', value: 'iridescent', label: 'Iridescent' }])
    expect(remainder).toBe('moon')
  })

  it('claims every term when the query is facets only', () => {
    const { facets, remainder } = claimFacets('iridescent dress', vocabulary)
    expect(facets).toHaveLength(2)
    expect(remainder).toBe('')
  })

  it('claims nothing when no term matches the vocabulary', () => {
    const { facets, remainder } = claimFacets('blooming dreams', vocabulary)
    expect(facets).toEqual([])
    expect(remainder).toBe('blooming dreams')
  })

  // claimFacets matches lowercase slugs exactly and splits on single spaces,
  // so callers MUST hand it a normalized query. Typing `Moon  Iridescent` is
  // entirely natural, and raw input silently claimed nothing at all.
  it('claims facets from a capitalized multi-term query once normalized', () => {
    const { facets, remainder } = claimFacets(normalizeQuery('  Moon   Iridescent '), vocabulary)
    expect(facets).toEqual([{ type: 'color', value: 'iridescent', label: 'Iridescent' }])
    expect(remainder).toBe('moon')
  })

  // The bug this guards: the raw string claims nothing.
  it('claims nothing from the same query un-normalized', () => {
    expect(claimFacets('  Moon   Iridescent ', vocabulary).facets).toEqual([])
  })

  // Only whole terms are claimed. Substring claiming would let "sweetheart"
  // surrender "sweet" and search for "heart".
  it('does not claim a term that merely contains a facet value', () => {
    const { facets, remainder } = claimFacets('sweetheart', vocabulary)
    expect(facets).toEqual([])
    expect(remainder).toBe('sweetheart')
  })
})
