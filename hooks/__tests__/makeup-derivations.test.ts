import { describe, expect, it } from 'vitest'
import {
  MAKEUP_BASE_ORDER,
  MAKEUP_EVOLUTION_ORDER,
  makeupSetOrder,
  OutfitLineRow,
  resolveEvolutionOutfitSet,
} from '@/hooks/makeup'

const outfit = (slug: string, order: number, base_set: string | null = null): OutfitLineRow => ({
  slug,
  order,
  base_set,
})

// One full 5-star line: base, three ordinary evolutions, and a glow-up (stored
// as order 0, the way app/admin/outfits/sets/actions.ts writes it).
const LINE: OutfitLineRow[] = [
  outfit('enchanted_encounter', MAKEUP_BASE_ORDER),
  outfit('enchanted_encounter-starfall', 2, 'enchanted_encounter'),
  outfit('enchanted_encounter-moonlit', 3, 'enchanted_encounter'),
  outfit('enchanted_encounter-dreamtrail', MAKEUP_EVOLUTION_ORDER, 'enchanted_encounter'),
  outfit('enchanted_encounter-glowup', 0, 'enchanted_encounter'),
]

describe('makeupSetOrder', () => {
  it('gives a base set order 1 and an evolution order 4', () => {
    expect(makeupSetOrder({ base_set: null })).toBe(MAKEUP_BASE_ORDER)
    expect(makeupSetOrder({ base_set: 'wishful_aurosa' })).toBe(MAKEUP_EVOLUTION_ORDER)
  })
})

describe('resolveEvolutionOutfitSet', () => {
  it("picks the line's order-4 evolution, not the base outfit", () => {
    expect(resolveEvolutionOutfitSet('enchanted_encounter', LINE)).toBe(
      'enchanted_encounter-dreamtrail'
    )
  })

  // The base set's own pairing is evolution-to-evolution for 28 of 68 links, so
  // the derivation has to walk up to the line root before collecting siblings.
  it('walks up to the line root when the base set pairs with an evolution', () => {
    expect(resolveEvolutionOutfitSet('enchanted_encounter-starfall', LINE)).toBe(
      'enchanted_encounter-dreamtrail'
    )
  })

  it('ignores the glow-up, which is stored as order 0 rather than a high order', () => {
    const withoutFour = LINE.filter((o) => o.order !== MAKEUP_EVOLUTION_ORDER)
    expect(resolveEvolutionOutfitSet('enchanted_encounter', withoutFour)).toBe(
      'enchanted_encounter-moonlit'
    )
  })

  // Never blank out a link that exists: a shorter line degrades to its highest
  // evolution, and a line with none degrades to the base's own pairing.
  it("falls back to the line's highest evolution below 4", () => {
    const shortLine = [
      outfit('serene_dream', MAKEUP_BASE_ORDER),
      outfit('serene_dream-tidal', 2, 'serene_dream'),
    ]
    expect(resolveEvolutionOutfitSet('serene_dream', shortLine)).toBe('serene_dream-tidal')
  })

  it("falls back to the base's own pairing on a line with no evolutions", () => {
    const lineless = [outfit('serene_dream', MAKEUP_BASE_ORDER)]
    expect(resolveEvolutionOutfitSet('serene_dream', lineless)).toBe('serene_dream')
  })

  it('returns null when the base set has no pairing to derive from', () => {
    expect(resolveEvolutionOutfitSet(null, LINE)).toBeNull()
  })

  it('returns null when the pairing names an outfit not in the given rows', () => {
    expect(resolveEvolutionOutfitSet('unknown_outfit', LINE)).toBeNull()
  })

  // A sibling on a DIFFERENT line must never be picked, however high its order.
  it('never crosses to another outfit line', () => {
    const twoLines = [...LINE, outfit('other_line-final', 5, 'other_line')]
    expect(resolveEvolutionOutfitSet('enchanted_encounter', twoLines)).toBe(
      'enchanted_encounter-dreamtrail'
    )
  })
})
