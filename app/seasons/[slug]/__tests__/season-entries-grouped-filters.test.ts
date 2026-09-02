import { describe, expect, it } from 'vitest'
import { applySeasonFilters, groupSeasonEntries } from '../season-entries'
import type { OutfitVariant } from '@/lib/types/outfit'

// SeasonOutfitList, SeasonContents, SeasonOverview, and SeasonProgress all call
// groupSeasonEntries then immediately pass the result through applySeasonFilters
// (Task 5 wiring). This exercises that exact composition — the pipeline every
// one of those consumers now runs — rather than just applySeasonFilters in
// isolation (already covered by season-entries-filters.test.ts) or
// groupSeasonEntries alone.

const variant = (slug: string, category: string, obtained: boolean): OutfitVariant =>
  ({
    slug,
    outfit_set: 'standalone_pieces',
    outfit_category: 'accessories',
    seasons: 'spring',
    season_category: category,
    rarity: 4,
    style: 'sweet',
    obtained,
  }) as OutfitVariant

const NO_FILTERS = { obtained: null, rarity: null, styles: [] }

describe('groupSeasonEntries + applySeasonFilters composition', () => {
  it('drops a category from the grouped output when every one of its entries fails the active filter', () => {
    const standaloneVariants = [
      variant('a', 'cat-a', true),
      variant('b', 'cat-b', false),
      variant('c', 'cat-b', false),
    ]

    const groups = groupSeasonEntries({
      seasonSets: [],
      standaloneVariants,
      makeupSets: [],
      seasonSlug: 'spring',
      hideEvolutions: false,
      hideGlowups: false,
    })

    // Before filtering, both categories are present.
    expect(groups.map(([category]) => category).sort()).toEqual(['cat-a', 'cat-b'])

    // "Obtained" matches only variant 'a' (cat-a) — every entry in cat-b fails,
    // so cat-b must disappear from the filtered output entirely. This is the
    // same output SeasonOutfitList renders from and SeasonContents lists, so a
    // category filtered out of the grid also vanishes from the TOC.
    const filtered = applySeasonFilters(groups, { ...NO_FILTERS, obtained: 'obtained' })

    expect(filtered).toHaveLength(1)
    expect(filtered[0][0]).toBe('cat-a')
    expect(filtered[0][1].map((e) => e.key)).toEqual(['standalone:a'])
  })

  it('keeps every category when no filter axis is active', () => {
    const standaloneVariants = [variant('a', 'cat-a', true), variant('b', 'cat-b', false)]

    const groups = groupSeasonEntries({
      seasonSets: [],
      standaloneVariants,
      makeupSets: [],
      seasonSlug: 'spring',
      hideEvolutions: false,
      hideGlowups: false,
    })

    expect(applySeasonFilters(groups, NO_FILTERS)).toEqual(groups)
  })
})
