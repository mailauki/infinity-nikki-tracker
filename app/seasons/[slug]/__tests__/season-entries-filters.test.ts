import { describe, expect, it } from 'vitest'
import { applySeasonFilters, type SeasonEntry } from '../season-entries'

const piece = (slug: string, obtained: boolean, rarity: number, style: string): SeasonEntry => ({
  kind: 'standalone',
  key: slug,
  variant: { slug, obtained, rarity, style } as never,
})

const groups: [string, SeasonEntry[]][] = [
  ['cat-a', [piece('a', true, 5, 'sweet'), piece('b', false, 3, 'cool')]],
  ['cat-b', [piece('c', false, 5, 'sweet')]],
]

const NO_FILTERS = { obtained: null, rarity: null, styles: [] }

describe('applySeasonFilters', () => {
  it('returns every group unchanged when no filter is set', () => {
    expect(applySeasonFilters(groups, NO_FILTERS)).toEqual(groups)
  })

  it('keeps only obtained entries', () => {
    const out = applySeasonFilters(groups, { ...NO_FILTERS, obtained: 'obtained' })
    expect(out).toHaveLength(1)
    expect(out[0][0]).toBe('cat-a')
    expect(out[0][1].map((e) => e.key)).toEqual(['a'])
  })

  it('keeps only missing entries', () => {
    const out = applySeasonFilters(groups, { ...NO_FILTERS, obtained: 'missing' })
    expect(out.flatMap(([, e]) => e.map((x) => x.key))).toEqual(['b', 'c'])
  })

  it('filters by rarity', () => {
    const out = applySeasonFilters(groups, { ...NO_FILTERS, rarity: 5 })
    expect(out.flatMap(([, e]) => e.map((x) => x.key))).toEqual(['a', 'c'])
  })

  it('filters by style', () => {
    const out = applySeasonFilters(groups, { ...NO_FILTERS, styles: ['cool'] })
    expect(out.flatMap(([, e]) => e.map((x) => x.key))).toEqual(['b'])
  })

  it('drops a category whose every entry is filtered out', () => {
    const out = applySeasonFilters(groups, { ...NO_FILTERS, styles: ['cool'] })
    expect(out.map(([name]) => name)).toEqual(['cat-a'])
  })

  it('combines axes conjunctively', () => {
    const out = applySeasonFilters(groups, { obtained: 'missing', rarity: 5, styles: ['sweet'] })
    expect(out.flatMap(([, e]) => e.map((x) => x.key))).toEqual(['c'])
  })
})
