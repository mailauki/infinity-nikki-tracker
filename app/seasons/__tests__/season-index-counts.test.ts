import { describe, expect, it } from 'vitest'
import {
  countCountableEntries,
  countEntries,
  countEntryCards,
  groupSeasonEntries,
} from '@/app/seasons/[slug]/season-entries'
import type { MakeupSet } from '@/lib/types/makeup'
import type { OutfitSet, OutfitVariant } from '@/lib/types/outfit'

// The seasons index used to count every card a season COULD show — evolutions
// and glow-ups expanded — while the season page it links to hides both by
// default. Shooting Star Season's "Limited-Time Resonance" row therefore
// advertised 30 cards and opened onto 15. These fix the shape of that category
// so the two can never drift apart again.
//
// The real data, verified against the DB:
//   4 outfit base sets, each with a glow-up (order 0) and 1-3 evolutions
//   6 standalone outfit pieces
//   1 makeup set (wings_of_wishes) with one evolution (wandering_wishes),
//     x 5 wearables each (base makeup, lenses, brows, lashes, lips)

const SEASON = 'shooting_star_season'
const CATEGORY = 'limited_time_resonance'

const variant = (slug: string, set: string) =>
  ({
    slug,
    outfit_set: set,
    seasons: SEASON,
    season_category: CATEGORY,
    obtained: false,
  }) as unknown as OutfitVariant

// A set plus its glow-up (order 0) and `evolutionCount` further states (order 2+).
const outfitSet = (slug: string, evolutionCount: number): OutfitSet => {
  const states = [
    { slug: `${slug}-glowup`, order: 0 },
    ...Array.from({ length: evolutionCount }, (_, i) => ({
      slug: `${slug}-evo${i}`,
      order: i + 2,
    })),
  ]
  return {
    slug,
    seasons: SEASON,
    season_category: CATEGORY,
    base_set: null,
    order: 1,
    evolutions: states.map((state) => ({ ...state, base_set: slug })),
    outfit_variants: [
      variant(`${slug}-v`, slug),
      ...states.map((state) => variant(`${state.slug}-v`, state.slug)),
    ],
  } as unknown as OutfitSet
}

const PARTS = ['base_makeup', 'contact_lenses', 'eyebrows', 'eyelashes', 'lips']

const makeupPieces = (setSlug: string) =>
  PARTS.map((part) => ({
    slug: `${setSlug}-${part}`,
    makeup_set: setSlug,
    makeup_category: part,
    seasons: SEASON,
    season_category: CATEGORY,
    obtained: false,
  }))

// Makeup sets reach this code already folded by getMakeupSets: an evolution is
// NESTED in its base set's `evolutions`, not a sibling row carrying base_set.
// `wandering_wishes` is the evolution of `wings_of_wishes`, which is why its
// five pieces drop out when evolutions are hidden.
const makeupSet = (slug: string, evolutionSlug: string | null): MakeupSet =>
  ({
    slug,
    seasons: SEASON,
    season_category: CATEGORY,
    base_set: null,
    makeup_variants: makeupPieces(slug),
    evolutions: evolutionSlug
      ? [
          {
            slug: evolutionSlug,
            base_set: slug,
            makeup_variants: makeupPieces(evolutionSlug),
          },
        ]
      : [],
  }) as unknown as MakeupSet

const seasonSets = [
  outfitSet('daughter_of_the_lake', 1),
  outfitSet('pink_ribbon_waltz', 1),
  outfitSet('starfall_radiance', 1),
  outfitSet('wings_of_wishes', 3),
]

const standaloneVariants = [
  'collected_memories-neckwear',
  'dawns_first_light-tops',
  'dreamy_afternoon-hair_accessories',
  'drifting_paper_boat-pendants',
  'rippling_time-bracelets',
  'sunlit_stars-earrings',
].map((slug) => variant(slug, 'standalone_pieces'))

const makeupSets = [makeupSet('wings_of_wishes', 'wandering_wishes')]

const count = (hideEvolutions: boolean, hideGlowups: boolean) => {
  const entries = groupSeasonEntries({
    seasonSets,
    standaloneVariants,
    makeupSets,
    seasonSlug: SEASON,
    hideEvolutions,
    hideGlowups,
    obtainedOutfit: [],
    obtainedMakeup: [],
  }).flatMap(([, categoryEntries]) => categoryEntries)
  return countEntryCards(entries).total
}

describe('seasons index row totals', () => {
  it('counts the cards the season page shows under its default toggles', () => {
    // 4 base sets + 6 standalone pieces + 5 base makeup pieces
    expect(count(true, true)).toBe(15)
  })

  it('counts every state when both toggles are off', () => {
    // + 4 glow-ups + 6 outfit evolutions + 5 makeup-evolution pieces
    expect(count(false, false)).toBe(30)
  })
})


// A grouped row rolls several categories onto one line, so counting its CARDS
// collapsed a whole run of the season to a single digit: Bloom Beneath Bright
// Skies' "Active Moments" gathers one category holding one eight-piece set, and
// read 1/1. Grouped rows therefore count pieces (variants) instead, while
// ungrouped category rows keep counting cards to stay in step with the season
// page's own chips.
describe('grouped season rows count pieces', () => {
  // The real shape, verified against the DB: season_group `active_moments`
  // holds one category (`active_rewards`) holding one base set with 8 variants.
  const ACTIVE_SEASON = 'bloom_beneath_bright_skies'

  const activeSet = {
    slug: 'new_journey_afar',
    seasons: ACTIVE_SEASON,
    season_category: 'active_rewards',
    base_set: null,
    order: 1,
    evolutions: [],
    outfit_variants: Array.from({ length: 8 }, (_, i) => ({
      slug: `new_journey_afar-v${i}`,
      outfit_set: 'new_journey_afar',
      seasons: ACTIVE_SEASON,
      season_category: 'active_rewards',
      obtained: false,
    })),
  } as unknown as OutfitSet

  // Obtained state is re-derived from the provider's rows, so a fully collected
  // set is expressed here rather than by the flags on the fixture.
  const allObtained = activeSet.outfit_variants.map(
    (variant) => ({ outfit_variant: variant.slug }) as never
  )

  const entries = groupSeasonEntries({
    seasonSets: [activeSet],
    standaloneVariants: [],
    makeupSets: [],
    seasonSlug: ACTIVE_SEASON,
    hideEvolutions: true,
    hideGlowups: true,
    obtainedOutfit: allObtained,
    obtainedMakeup: [],
  }).flatMap(([, categoryEntries]) => categoryEntries)

  it('counts the pieces of a group row, not its cards', () => {
    expect(countEntries(entries)).toEqual({ obtained: 8, total: 8 })
  })

  it('still counts one card, which is what made the row read 1/1', () => {
    expect(countEntryCards(entries).total).toBe(1)
  })
})


// The game does not count a `handheld_base_only` set's handheld toward the set
// total — it is a bonus piece awarded separately, long after the set. Exploration
// Season's "Styles that Resonate" holds four such sets, which is why the row read
// 289/347 against the game's 285/343.
describe('handheld_base_only handhelds are left out of season totals', () => {
  const HH_SEASON = 'exploration_season'

  // One base set: 8 ordinary pieces plus the separately-awarded handheld.
  const setWithBonusHandheld = (slug: string, handheldBaseOnly: boolean) =>
    ({
      slug,
      seasons: HH_SEASON,
      season_category: 'distant_sea',
      base_set: null,
      order: 1,
      handheld_base_only: handheldBaseOnly,
      evolutions: [],
      outfit_variants: [
        ...Array.from({ length: 8 }, (_, i) => ({
          slug: `${slug}-v${i}`,
          outfit_set: slug,
          outfit_category: 'tops',
          seasons: HH_SEASON,
          season_category: 'distant_sea',
        })),
        {
          slug: `${slug}-handhelds`,
          outfit_set: slug,
          outfit_category: 'handhelds',
          seasons: HH_SEASON,
          season_category: 'distant_sea',
        },
      ],
    }) as unknown as OutfitSet

  const entriesFor = (handheldBaseOnly: boolean) =>
    groupSeasonEntries({
      seasonSets: [setWithBonusHandheld('crystal_poems', handheldBaseOnly)],
      standaloneVariants: [],
      makeupSets: [],
      seasonSlug: HH_SEASON,
      hideEvolutions: true,
      hideGlowups: true,
      obtainedOutfit: [],
      obtainedMakeup: [],
    }).flatMap(([, categoryEntries]) => categoryEntries)

  it('drops the handheld from the total when the set is flagged base-only', () => {
    expect(countCountableEntries(entriesFor(true)).total).toBe(8)
  })

  it('keeps a normal set’s handheld in the total', () => {
    expect(countCountableEntries(entriesFor(false)).total).toBe(9)
  })

  it('still reports every piece on the card itself', () => {
    // The handheld is real and collectable — only the denominator ignores it.
    expect(countEntries(entriesFor(true)).total).toBe(9)
  })

  it('leaves the card count alone — a set is one card either way', () => {
    expect(countEntryCards(entriesFor(true)).total).toBe(1)
  })
})
