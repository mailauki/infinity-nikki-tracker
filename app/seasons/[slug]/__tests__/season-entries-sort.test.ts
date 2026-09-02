import { describe, expect, it } from 'vitest'
import { sortSeasonEntries, type SeasonEntry } from '../season-entries'

// The season toolbar's sort button reverses the cards WITHIN each category.
// Before this existed the button was inert — it wrote to the sort context and
// no season renderer read it.

const piece = (id: number, title: string, rarity: number, obtained = false): SeasonEntry => ({
  kind: 'standalone',
  key: `p${id}`,
  variant: { id, slug: `p${id}`, title, rarity, obtained } as never,
})

const groups: [string, SeasonEntry[]][] = [
  [
    'cat-a',
    [piece(1, 'Banana', 3), piece(2, 'Apple', 5, true), piece(3, 'Cherry', 4)],
  ],
]

const keys = (g: [string, SeasonEntry[]][]) => g[0][1].map((e) => e.key)

describe('sortSeasonEntries', () => {
  it('orders by id descending on the date axis, newest first', () => {
    expect(keys(sortSeasonEntries(groups, 'date', 'desc'))).toEqual(['p3', 'p2', 'p1'])
  })

  it('reverses on the same axis, which is what the toolbar button toggles', () => {
    expect(keys(sortSeasonEntries(groups, 'date', 'asc'))).toEqual(['p1', 'p2', 'p3'])
  })

  it('orders by rarity, highest first when descending', () => {
    expect(keys(sortSeasonEntries(groups, 'rarity', 'desc'))).toEqual(['p2', 'p3', 'p1'])
  })

  it('orders titles A-Z when ascending', () => {
    expect(keys(sortSeasonEntries(groups, 'title', 'asc'))).toEqual(['p2', 'p1', 'p3'])
  })

  it('orders by completion on the progress axis', () => {
    expect(keys(sortSeasonEntries(groups, 'progress', 'desc'))[0]).toBe('p2')
  })

  it('leaves the category list and its membership untouched', () => {
    const out = sortSeasonEntries(groups, 'rarity', 'asc')
    expect(out.map(([c]) => c)).toEqual(['cat-a'])
    expect(out[0][1]).toHaveLength(3)
  })

  it('does not mutate the input array', () => {
    const before = keys(groups)
    sortSeasonEntries(groups, 'title', 'asc')
    expect(keys(groups)).toEqual(before)
  })
})
