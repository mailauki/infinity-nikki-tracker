import { describe, expect, it } from 'vitest'
import { deriveVariantSlug } from '@/lib/variant-slug'

describe('deriveVariantSlug', () => {
  it('uses set + category for a real set', () => {
    expect(
      deriveVariantSlug({ set: 'dawning_heartlight', category: 'headwear', title: 'Anything' })
    ).toBe('dawning_heartlight-headwear')
  })

  it('uses title + category for the standalone bag set', () => {
    expect(
      deriveVariantSlug({ set: 'standalone_pieces', category: 'hair', title: 'Silverplume Wings' })
    ).toBe('silverplume_wings-hair')
  })

  it('uses title + category when there is no set at all', () => {
    expect(deriveVariantSlug({ set: null, category: 'hair', title: 'Silverplume' })).toBe(
      'silverplume-hair'
    )
  })

  it('changes only the category segment when recategorizing', () => {
    const before = deriveVariantSlug({
      set: 'hymn_to_dusk',
      category: 'outerwear',
      title: 'Torrent of Fate',
    })
    const after = deriveVariantSlug({
      set: 'hymn_to_dusk',
      category: 'back_pieces',
      title: 'Torrent of Fate',
    })
    expect(before).toBe('hymn_to_dusk-outerwear')
    expect(after).toBe('hymn_to_dusk-back_pieces')
  })

  it('omits empty segments rather than leaving a dangling separator', () => {
    expect(deriveVariantSlug({ set: 'moonlit', category: null, title: null })).toBe('moonlit')
  })

  // 437 of 729 outfit_sets rows are evolutions whose slug legitimately contains
  // a hyphen (`dustwoven_tribute-expedition`). Running toSlug() over the set
  // segment would rewrite that hyphen to an underscore and produce a slug that
  // matches no storage folder, so the set segment is used verbatim. Only the
  // bag-set title stem is slugged.
  it('leaves a hyphenated evolution set slug intact', () => {
    expect(
      deriveVariantSlug({
        set: 'dustwoven_tribute-expedition',
        category: 'gloves',
        title: null,
      })
    ).toBe('dustwoven_tribute-expedition-gloves')
  })
})
