import {
  MakeupCategory,
  MakeupEvolution,
  MakeupSet,
  MakeupSetRaw,
  MakeupVariant,
  ObtainedMakeup,
} from '@/lib/types/makeup'

// Base vs evolution resolution lives here and nowhere else. A base row has
// base_set === null (order 1); an evolution row points base_set at its base's
// slug (order >= 2). Never inline this check at a call site.
export function isBaseMakeupSet(row: Pick<MakeupSetRaw, 'base_set'>) {
  return row.base_set === null
}

// The bucket for set-less variants. A standalone piece is a variant carrying
// the `standalone_pieces` slug on makeup_set (a straggler NULL row is still
// tolerated), but `makeup_sets` now also carries a real `standalone_pieces`
// row so obtained_makeup.makeup_set can hold an FK. `createMakeupSet` excludes
// that row from the table-driven sets and emits the synthetic bucket below
// instead, which is the one that actually carries the pieces.
export const STANDALONE_MAKEUP_SLUG = 'standalone_pieces'

export type OutfitSetRef = { slug: string; title: string; image_url: string | null }

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
      // /outfits/seasons/{slug} href needs.
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
