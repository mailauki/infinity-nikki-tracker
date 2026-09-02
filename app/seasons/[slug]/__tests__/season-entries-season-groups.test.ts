import { describe, expect, it } from 'vitest'
import { groupCategoriesBySeasonGroup, OTHER_CATEGORY, type SeasonEntry } from '../season-entries'
import type { SeasonCategory, SeasonGroup } from '@/lib/types/outfit'

// season_groups is a display-only heading over season_categories. A season shows
// headings iff some category in it carries a season_group — the "does this
// season group?" question is derived here rather than stored on the season, so
// these tests pin that derivation.

const piece = (id: number): SeasonEntry => ({
  kind: 'standalone',
  key: `p${id}`,
  variant: { id, slug: `p${id}`, title: `Piece ${id}`, obtained: false } as never,
})

const category = (slug: string, season_group: string | null): SeasonCategory =>
  ({ id: 1, slug, title: slug.toUpperCase(), season_group }) as SeasonCategory

const group = (slug: string): SeasonGroup =>
  ({ id: 1, slug, title: slug.toUpperCase() }) as SeasonGroup

const entriesFor = (...slugs: string[]): [string, SeasonEntry[]][] =>
  slugs.map((slug, i) => [slug, [piece(i + 1)]])

describe('groupCategoriesBySeasonGroup', () => {
  it('leaves every category ungrouped when no category carries a group', () => {
    const sections = groupCategoriesBySeasonGroup(
      entriesFor('chests', 'events'),
      [category('chests', null), category('events', null)],
      [group('rewards')]
    )

    // One ungrouped section holding both, so the page renders exactly as it did
    // before groups existed.
    expect(sections).toHaveLength(1)
    expect(sections[0].group).toBeNull()
    expect(sections[0].categories.map(([slug]) => slug)).toEqual(['chests', 'events'])
  })

  it('collapses adjacent categories sharing a group into one section', () => {
    const sections = groupCategoriesBySeasonGroup(
      entriesFor('chests', 'events'),
      [category('chests', 'rewards'), category('events', 'rewards')],
      [group('rewards')]
    )

    expect(sections).toHaveLength(1)
    expect(sections[0].group?.slug).toBe('rewards')
    expect(sections[0].categories.map(([slug]) => slug)).toEqual(['chests', 'events'])
  })

  it('mixes grouped and ungrouped categories in the same season', () => {
    const sections = groupCategoriesBySeasonGroup(
      entriesFor('chests', 'solo', 'events'),
      [category('chests', 'rewards'), category('solo', null), category('events', 'rewards')],
      [group('rewards')]
    )

    expect(sections.map((s) => s.group?.slug ?? null)).toEqual(['rewards', null, 'rewards'])
  })

  it('does not hoist a group across an intervening category', () => {
    // The incoming order is the sort the user chose. Gathering the two "rewards"
    // categories would silently reorder the page, so the group opens a second
    // section instead.
    const sections = groupCategoriesBySeasonGroup(
      entriesFor('chests', 'solo', 'events'),
      [category('chests', 'rewards'), category('solo', null), category('events', 'rewards')],
      [group('rewards')]
    )

    expect(sections).toHaveLength(3)
    expect(sections[0].categories.map(([slug]) => slug)).toEqual(['chests'])
    expect(sections[2].categories.map(([slug]) => slug)).toEqual(['events'])
  })

  it('treats the synthetic Other bucket as ungrouped', () => {
    // OTHER_CATEGORY collects rows with no category at all, so it has no row in
    // season_categories to carry a group.
    const sections = groupCategoriesBySeasonGroup(
      entriesFor(OTHER_CATEGORY),
      [],
      [group('rewards')]
    )

    expect(sections).toHaveLength(1)
    expect(sections[0].group).toBeNull()
  })

  it('falls back to ungrouped when a category points at a missing group', () => {
    // A group deleted between render and read must not produce a heading with
    // no title.
    const sections = groupCategoriesBySeasonGroup(
      entriesFor('chests'),
      [category('chests', 'deleted_group')],
      []
    )

    expect(sections).toHaveLength(1)
    expect(sections[0].group).toBeNull()
  })

  it('preserves the entries it was handed', () => {
    const sections = groupCategoriesBySeasonGroup(
      entriesFor('chests'),
      [category('chests', 'rewards')],
      [group('rewards')]
    )

    expect(sections[0].categories[0][1].map((e) => e.key)).toEqual(['p1'])
  })
})
