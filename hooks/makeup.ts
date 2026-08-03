import {
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

/**
 * Fold flat makeup_sets rows into base sets, each carrying its evolutions
 * (ordered by `order`) and its own variants. Evolution rows are removed from
 * the top level. An evolution whose base_set matches no base row is dropped
 * rather than promoted — a dangling base_set is bad data, not a base set.
 */
export function createMakeupSet(rows: MakeupSetRaw[], variants: MakeupVariant[]): MakeupSet[] {
  const variantsBySet = new Map<string, MakeupVariant[]>()
  for (const variant of variants) {
    if (!variant.makeup_set) continue
    const list = variantsBySet.get(variant.makeup_set)
    if (list) list.push(variant)
    else variantsBySet.set(variant.makeup_set, [variant])
  }

  const build = (row: MakeupSetRaw, evolutions: MakeupEvolution[]) =>
    ({
      ...row,
      makeup_variants: variantsBySet.get(row.slug) ?? [],
      evolutions,
      season: row.seasons ? { title: row.seasons } : null,
      seasonCategory: row.season_category ? { title: row.season_category } : null,
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

  return rows.filter(isBaseMakeupSet).map((row) => build(row, evolutionsByBase.get(row.slug) ?? []))
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
