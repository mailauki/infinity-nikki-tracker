import { describe, expect, it } from 'vitest'
import {
  applySeasonFilters,
  countCountableEntries,
  countEntries,
  countEntryCards,
  countEntryKinds,
  EUREKA_CATEGORY,
  groupSeasonEntries,
  MOMO_CLOAKS_CATEGORY,
  sortSeasonEntries,
  type SeasonEntry,
} from '../season-entries'
import type { EurekaSet } from '@/lib/types/eureka'
import type { MomoCloak } from '@/lib/types/momo'
import type { Release } from '@/hooks/release'

const SEASON = 'exploration_season'

const eureka = (
  slug: string,
  obtained: boolean[],
  release: Release = { released_at: null, version: null }
) =>
  ({
    id: slug.length,
    slug,
    title: slug,
    rarity: 4,
    style: 'elegant',
    seasons: SEASON,
    release,
    eureka_variants: obtained.map((o, i) => ({ slug: `${slug}-${i}`, obtained: o })),
  }) as unknown as EurekaSet

const cloak = (slug: string, category: string | null, rarity = 4) =>
  ({
    id: slug.length,
    slug,
    title: slug,
    rarity,
    style: 'cute',
    seasons: SEASON,
    season_category: category,
    season: null,
    released_at: null,
    version: null,
  }) as unknown as MomoCloak

const base = {
  seasonSets: [],
  standaloneVariants: [],
  makeupSets: [],
  seasonSlug: SEASON,
  hideEvolutions: true,
  hideGlowups: true,
}

const flat = (groups: [string, SeasonEntry[]][]) => groups.flatMap(([, e]) => e)

describe('eureka entries', () => {
  it('groups every eureka set of the season under eureka_collection, one card each', () => {
    const groups = groupSeasonEntries({
      ...base,
      eurekaSets: [eureka('a', [true, false]), eureka('b', [true])],
    })
    expect(groups).toEqual([[EUREKA_CATEGORY, expect.any(Array)]])
    expect(groups[0][1].map((e) => e.key)).toEqual(['eureka:a', 'eureka:b'])
  })

  it('ignores eureka sets from another season', () => {
    const other = { ...eureka('x', [true]), seasons: 'terras_call' } as EurekaSet
    expect(groupSeasonEntries({ ...base, eurekaSets: [other] })).toEqual([])
  })

  it('counts 1 per set, obtained only when every variant is', () => {
    const entries = flat(
      groupSeasonEntries({
        ...base,
        eurekaSets: [eureka('a', [true, false]), eureka('b', [true, true])],
      })
    )
    expect(countEntries(entries)).toEqual({ total: 2, obtained: 1 })
    expect(countCountableEntries(entries)).toEqual({ total: 2, obtained: 1 })
    expect(countEntryKinds(entries).eureka).toBe(2)
    expect(countEntryKinds(entries).obtained.eureka).toBe(1)
  })

  it('is dropped by hideEureka', () => {
    expect(
      groupSeasonEntries({ ...base, eurekaSets: [eureka('a', [true])], hideEureka: true })
    ).toEqual([])
  })
})

describe('cloak entries', () => {
  it('files a cloak under its own season category', () => {
    const groups = groupSeasonEntries({ ...base, cloaks: [cloak('c1', 'limited_time_resonance')] })
    expect(groups[0][0]).toBe('limited_time_resonance')
  })

  it("files an uncategorised cloak under Momo's Cloaks, never Other", () => {
    const groups = groupSeasonEntries({ ...base, cloaks: [cloak('c1', null)] })
    expect(groups[0][0]).toBe(MOMO_CLOAKS_CATEGORY)
  })

  it('never counts toward any total', () => {
    const entries = flat(
      groupSeasonEntries({
        ...base,
        cloaks: [cloak('c1', null), cloak('c2', 'distant_sea')],
        obtainedCloaks: new Set(['c1']),
        eurekaSets: [eureka('a', [true])],
      })
    )
    expect(countEntries(entries)).toEqual({ total: 1, obtained: 1 })
    expect(countCountableEntries(entries)).toEqual({ total: 1, obtained: 1 })
    expect(countEntryCards(entries)).toEqual({ total: 1, obtained: 1 })
    const kinds = countEntryKinds(entries)
    expect(kinds.outfit + kinds.standalone + kinds.eureka).toBe(1)
  })

  it('yields 0/0 for a category holding only cloaks', () => {
    const entries = flat(groupSeasonEntries({ ...base, cloaks: [cloak('c1', null)] }))
    expect(countEntryCards(entries)).toEqual({ total: 0, obtained: 0 })
  })

  it('still answers the obtained and rarity filters', () => {
    const groups = groupSeasonEntries({
      ...base,
      cloaks: [cloak('c1', null, 5), cloak('c2', null, 3)],
      obtainedCloaks: new Set(['c1']),
    })
    const obtained = applySeasonFilters(groups, { obtained: 'obtained', rarity: null, styles: [] })
    expect(flat(obtained).map((e) => e.key)).toEqual(['momo-cloak:c1'])
    const rare = applySeasonFilters(groups, { obtained: null, rarity: 3, styles: [] })
    expect(flat(rare).map((e) => e.key)).toEqual(['momo-cloak:c2'])
  })

  it('is dropped by hideCloaks', () => {
    expect(groupSeasonEntries({ ...base, cloaks: [cloak('c1', null)], hideCloaks: true })).toEqual(
      []
    )
  })
})

describe('date sort on the season page', () => {
  it('orders eureka sets by their own release, undated last', () => {
    const groups = groupSeasonEntries({
      ...base,
      eurekaSets: [
        eureka('old', [false], { released_at: '2024-12-05', version: '1.0' }),
        eureka('none', [false]),
        eureka('new', [false], { released_at: '2025-06-01', version: '1.6' }),
      ],
    })
    const keys = (dir: 'asc' | 'desc') =>
      sortSeasonEntries(groups, 'date', dir)[0][1].map((e) => e.key)
    expect(keys('desc')).toEqual(['eureka:new', 'eureka:old', 'eureka:none'])
    expect(keys('asc')).toEqual(['eureka:old', 'eureka:new', 'eureka:none'])
  })

  it('lets a mid-season piece override sort after the season default', () => {
    const season = { released_at: '2025-04-29', version: '1.5' }
    const piece = (slug: string, released_at: string | null) =>
      ({
        id: slug.length,
        slug,
        seasons: SEASON,
        season_category: 'x',
        released_at,
        version: null,
        obtained: false,
      }) as never
    const groups = groupSeasonEntries({
      ...base,
      seasonRelease: season,
      standaloneVariants: [piece('launch', null), piece('midseason', '2025-05-20')],
    })
    expect(sortSeasonEntries(groups, 'date', 'desc')[0][1].map((e) => e.key)).toEqual([
      'standalone:midseason',
      'standalone:launch',
    ])
  })
})
