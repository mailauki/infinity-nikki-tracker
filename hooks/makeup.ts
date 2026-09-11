import {
  MakeupCategory,
  MakeupEvolution,
  MakeupSet,
  MakeupSetRaw,
  MakeupVariant,
  ObtainedMakeup,
} from '@/lib/types/makeup'
import { EvolvableLinkedSet, OutfitSetRaw } from '@/lib/types/outfit'

// Base vs evolution resolution lives here and nowhere else. A base row has
// base_set === null (order 1); an evolution row points base_set at its base's
// slug (order 4 — see makeupSetOrder below). Never inline this check at a call
// site.
export function isBaseMakeupSet(row: Pick<MakeupSetRaw, 'base_set'>) {
  return row.base_set === null
}

// `order` is derived from base_set, never chosen: a base set is always 1, and a
// makeup evolution is always the outfit line's max evolution — order 4, paired
// with the order-4 outfit_sets row it hangs off. The admin forms and the sets
// DataGrid therefore show no order control; both mutation paths in
// app/admin/makeup/sets/actions.ts call makeupSetOrder() instead.
export const MAKEUP_BASE_ORDER = 1
export const MAKEUP_EVOLUTION_ORDER = 4

export function makeupSetOrder(row: Pick<MakeupSetRaw, 'base_set'>) {
  return isBaseMakeupSet(row) ? MAKEUP_BASE_ORDER : MAKEUP_EVOLUTION_ORDER
}

/** The outfit_sets columns the pairing derivation reads. */
export type OutfitLineRow = Pick<OutfitSetRaw, 'slug' | 'base_set' | 'order'>

/**
 * Which outfit a makeup EVOLUTION pairs with, derived from the outfit its base
 * makeup set pairs with. Makeup pairings are evolution-to-evolution (see
 * EvolvableLinkedSet) — an evolution hangs off the outfit line's max evolution,
 * order 4, the same order the makeup evolution itself carries — so the pairing
 * follows from the base set's and is never picked by hand.
 *
 * `outfitSets` is any collection of outfit_sets rows containing the base's
 * paired row and that line's siblings: the admin forms pass their full list,
 * the Server Actions pass the rows they fetched for the one line.
 *
 * Returns null only when the base set has no pairing to derive from — there is
 * nothing to point at then. Otherwise it always resolves to a row on the same
 * line: the order-4 evolution, or, on a line that never reaches 4, its highest
 * evolution and then the base's own pairing. Deriving must not silently blank
 * out a link that exists, so it degrades instead of returning null.
 */
export function resolveEvolutionOutfitSet(
  baseOutfitSet: string | null,
  outfitSets: OutfitLineRow[]
): string | null {
  if (!baseOutfitSet) return null

  const paired = outfitSets.find((outfit) => outfit.slug === baseOutfitSet)
  if (!paired) return null

  // The base's own pairing may already be an evolution, so walk up to the line
  // root before collecting siblings off it.
  const root = paired.base_set ?? paired.slug

  // Orders on an outfit line: the base is 1 and a glow-up is 0, so an `>= 2`
  // floor leaves exactly the ordinary evolutions. MAKEUP_EVOLUTION_ORDER is
  // matched first to keep the rule exact; the highest is the graceful answer for
  // a shorter line.
  const evolutions = outfitSets.filter(
    (outfit) => outfit.base_set === root && outfit.order >= MAKEUP_BASE_ORDER + 1
  )

  const atEvolutionOrder = evolutions.find((outfit) => outfit.order === MAKEUP_EVOLUTION_ORDER)
  if (atEvolutionOrder) return atEvolutionOrder.slug

  const highest = evolutions.reduce<OutfitLineRow | null>(
    (best, outfit) => (best === null || outfit.order > best.order ? outfit : best),
    null
  )
  return highest?.slug ?? paired.slug
}

// The bucket for set-less variants. A standalone piece is a variant carrying
// the `standalone_pieces` slug on makeup_set (a straggler NULL row is still
// tolerated), but `makeup_sets` now also carries a real `standalone_pieces`
// row so obtained_makeup.makeup_set can hold an FK. `createMakeupSet` excludes
// that row from the table-driven sets and emits the synthetic bucket below
// instead, which is the one that actually carries the pieces.
export const STANDALONE_MAKEUP_SLUG = 'standalone_pieces'

// Same shape as the outfit domain's linked-sibling ref, including alt art and
// base_set — aliased rather than redeclared so the two can't drift apart.
export type OutfitSetRef = EvolvableLinkedSet

// Lookup rows used only to resolve display titles for makeup_sets.seasons /
// season_category, whose stored values are slug-shaped rather than titles.
export type SeasonRef = { slug: string; title: string }
export type SeasonCategoryRef = { title: string }

export function isStandaloneMakeupSet(set: Pick<MakeupSet, 'slug'>) {
  return set.slug === STANDALONE_MAKEUP_SLUG
}

/**
 * Fold flat makeup_sets rows into base sets, each carrying its evolutions
 * (ordered by `order`) and its own variants. Evolution rows are removed from
 * the top level. An evolution whose base_set matches no base row is dropped
 * rather than promoted — a dangling base_set is bad data, not a base set.
 *
 * Set-less variants (makeup_set IS NULL) are folded into one synthetic
 * "Standalone Pieces" set, appended LAST. It is omitted entirely when no such
 * variants exist.
 */
export function createMakeupSet(
  rows: MakeupSetRaw[],
  variants: MakeupVariant[],
  categories: MakeupCategory[] = [],
  outfitSets: OutfitSetRef[] = [],
  seasons: SeasonRef[] = [],
  seasonCategories: SeasonCategoryRef[] = []
): MakeupSet[] {
  const variantsBySet = new Map<string, MakeupVariant[]>()
  const standaloneVariants: MakeupVariant[] = []
  for (const variant of variants) {
    if (!variant.makeup_set || variant.makeup_set === STANDALONE_MAKEUP_SLUG) {
      standaloneVariants.push(variant)
      continue
    }
    const list = variantsBySet.get(variant.makeup_set)
    if (list) list.push(variant)
    else variantsBySet.set(variant.makeup_set, [variant])
  }

  const outfitSetBySlug = new Map(outfitSets.map((o) => [o.slug, o]))
  const seasonTitleBySlug = new Map(seasons.map((s) => [s.slug, s.title]))
  // season_categories has no slug column, so match on a normalized title.
  // `toSlug` alone is not enough: it maps "Limited-Time Resonance" to
  // 'limited-time_resonance', but makeup_sets stores 'limited_time_resonance'
  // — the hyphen is an underscore there. Collapse both separators to one form
  // on each side so the two meet.
  const normalize = (value: string) => value.toLowerCase().replace(/[\s\-_]+/g, '_')
  const seasonCategoryTitleBySlug = new Map(
    seasonCategories.map((c) => [normalize(c.title), c.title])
  )

  const build = (row: MakeupSetRaw, evolutions: MakeupEvolution[]) =>
    ({
      ...row,
      // Base rows must carry their evolutions' variants too, so consumers ported
      // from outfits (which filter this list by state slug) can find them. Makeup
      // has no glow-up title derivation, so this is a plain concatenation — see
      // hooks/outfit.ts's `allVariants` for the richer outfits equivalent.
      makeup_variants: [
        ...(variantsBySet.get(row.slug) ?? []),
        ...evolutions.flatMap((e) => e.makeup_variants ?? []),
      ],
      makeup_categories: categories,
      evolutions,
      // makeup_sets.seasons / season_category declare FKs to seasons(title) and
      // season_categories(title), but the stored values are slug-shaped
      // ('firework_season', 'limited_time_resonance') rather than the display
      // titles — so the FK does not resolve and the raw column renders as a slug.
      //
      // Resolve against the real lookup rows. Deriving the title by string
      // munging is NOT sufficient: 'heart_of_infinity' and
      // 'limited_time_resonance' become "Heart Of Infinity" and "Limited Time
      // Resonance", where the actual titles are "Heart of Infinity" and
      // "Limited-Time Resonance". Fall back to the raw value so an unmatched
      // row still shows something rather than blanking out.
      //
      // The raw `seasons` column stays untouched — it is what the
      // /seasons/{slug} href needs.
      season: row.seasons ? { title: seasonTitleBySlug.get(row.seasons) ?? row.seasons } : null,
      seasonCategory: row.season_category
        ? {
            title:
              seasonCategoryTitleBySlug.get(normalize(row.season_category)) ?? row.season_category,
          }
        : null,
      outfitSet: row.outfit_set ? (outfitSetBySlug.get(row.outfit_set) ?? null) : null,
    }) as MakeupSet

  const evolutionsByBase = new Map<string, MakeupEvolution[]>()
  for (const row of rows) {
    if (isBaseMakeupSet(row)) continue
    const base = row.base_set as string
    const evolution = build(row, []) as MakeupEvolution
    const list = evolutionsByBase.get(base)
    if (list) list.push(evolution)
    else evolutionsByBase.set(base, [evolution])
  }

  for (const list of evolutionsByBase.values()) {
    list.sort((a, b) => a.order - b.order)
  }

  // The standalone bucket now has a real makeup_sets row (so obtained_makeup
  // can carry an FK on makeup_set), but its variants carry the
  // `standalone_pieces` slug (or, for a straggler row, NULL) and are collected
  // into `standaloneVariants` above instead of `variantsBySet`. Exclude the
  // row here so it isn't emitted twice — once empty from the table and once
  // populated from the synthetic branch, which is the one that actually
  // carries the pieces.
  const sets = rows
    .filter((row) => isBaseMakeupSet(row) && row.slug !== STANDALONE_MAKEUP_SLUG)
    .map((row) => build(row, evolutionsByBase.get(row.slug) ?? []))

  if (standaloneVariants.length === 0) return sets

  // A synthetic row: not from the database, so it carries only what consumers
  // read. Rarity 0 keeps it out of every rarity bucket; callers that filter by
  // rarity treat it as a mixed bag and match on its pieces instead.
  const standalone = {
    id: -1,
    slug: STANDALONE_MAKEUP_SLUG,
    title: 'Standalone Pieces',
    description: null,
    rarity: 0,
    style: null,
    seasons: null,
    season_category: null,
    outfit_set: null,
    order: 1,
    base_set: null,
    image_url: standaloneVariants[0]?.image_url ?? null,
    alt_image_url: null,
    created_at: null,
    updated_at: null,
    makeup_variants: standaloneVariants,
    makeup_categories: categories,
    evolutions: [],
    season: null,
    seasonCategory: null,
    outfitSet: null,
  } as unknown as MakeupSet

  return [...sets, standalone]
}

/** Obtained rows are keyed by variant slug, matching toggle_obtained_makeup. */
export function buildObtainedMakeupKeySet(obtained: ObtainedMakeup[]) {
  return new Set(obtained.map((row) => row.makeup_variant))
}

export function isMakeupVariantObtained(variant: MakeupVariant, keys: Set<string>) {
  return keys.has(variant.slug)
}

export function applyObtainedMakeupKeys(variants: MakeupVariant[], keys: Set<string>) {
  return variants.map((variant) => ({
    ...variant,
    obtained: isMakeupVariantObtained(variant, keys),
  }))
}
