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

// The client-side bucket for set-less variants. Unlike outfits — which stores a
// real `standalone_pieces` row — makeup has no container row: a standalone piece
// is a variant with makeup_set IS NULL. This slug therefore never exists in
// makeup_sets, so /makeup/standalone-pieces correctly 404s and nothing links to it.
export const STANDALONE_MAKEUP_SLUG = 'standalone-pieces'

export type OutfitSetRef = { slug: string; title: string; image_url: string | null }

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
  outfitSets: OutfitSetRef[] = []
): MakeupSet[] {
  const variantsBySet = new Map<string, MakeupVariant[]>()
  const standaloneVariants: MakeupVariant[] = []
  for (const variant of variants) {
    if (!variant.makeup_set) {
      standaloneVariants.push(variant)
      continue
    }
    const list = variantsBySet.get(variant.makeup_set)
    if (list) list.push(variant)
    else variantsBySet.set(variant.makeup_set, [variant])
  }

  const outfitSetBySlug = new Map(outfitSets.map((o) => [o.slug, o]))

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
      season: row.seasons ? { title: row.seasons } : null,
      seasonCategory: row.season_category ? { title: row.season_category } : null,
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

  const sets = rows
    .filter(isBaseMakeupSet)
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
    label: null,
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
