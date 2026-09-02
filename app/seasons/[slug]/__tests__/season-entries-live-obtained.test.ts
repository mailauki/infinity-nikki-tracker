import { describe, expect, it } from 'vitest'
import { groupSeasonEntries } from '../season-entries'
import type { MakeupSet } from '@/lib/types/makeup'
import type { ObtainedMakeup } from '@/lib/types/makeup'

// A season page fetches its makeup sets server-side, so the `obtained` flags on
// those props are a snapshot from render time. Collection state lives in the
// makeup provider, and a toggle only updates the provider — so if these entries
// are not re-derived from it, the DB write succeeds while the card never
// repaints. That was the bug; these guard both directions of it.

const makeupVariant = (slug: string, obtained: boolean) =>
  ({ slug, makeup_set: 'glam', makeup_category: 'lips', obtained }) as never

const seasonMakeupSet = (obtained: boolean) =>
  ({
    slug: 'glam',
    seasons: 'spring',
    season_category: 'cat',
    makeup_variants: [makeupVariant('lips-1', obtained)],
    evolutions: [],
  }) as unknown as MakeupSet

const obtainedRow = (slug: string) => ({ makeup_variant: slug }) as ObtainedMakeup

function firstEntry(makeupSets: MakeupSet[], obtainedMakeup: ObtainedMakeup[]) {
  const groups = groupSeasonEntries({
    seasonSets: [],
    standaloneVariants: [],
    makeupSets,
    seasonSlug: 'spring',
    hideEvolutions: false,
    hideGlowups: false,
    obtainedMakeup,
  })
  const [[, entries]] = groups
  return entries[0] as { variant: { obtained?: boolean } }
}

describe('groupSeasonEntries live makeup obtained state', () => {
  it('marks a piece obtained when the provider lists it, over a stale prop', () => {
    expect(firstEntry([seasonMakeupSet(false)], [obtainedRow('lips-1')]).variant.obtained).toBe(true)
  })

  it('clears obtained when the provider no longer lists it', () => {
    expect(firstEntry([seasonMakeupSet(true)], []).variant.obtained).toBe(false)
  })

  it('leaves the props untouched when no provider rows are passed', () => {
    const groups = groupSeasonEntries({
      seasonSets: [],
      standaloneVariants: [],
      makeupSets: [seasonMakeupSet(true)],
      seasonSlug: 'spring',
      hideEvolutions: false,
      hideGlowups: false,
    })
    const [[, entries]] = groups
    expect((entries[0] as { variant: { obtained?: boolean } }).variant.obtained).toBe(true)
  })
})
