import {
  Evolution,
  OutfitCategory,
  OutfitSet,
  OutfitVariant,
  ObtainedOutfit,
} from '@/lib/types/outfit'
import { ObtainedFilter } from '@/lib/types/props'

// Whether a group of variants passes the selected set-level obtained filter.
// The filter is binary: 'obtained' matches only fully-complete groups (every
// variant obtained), and 'missing' matches any group that is NOT fully complete
// — empty, none obtained, or partially obtained. A null filter passes everything.
export function matchesObtainedFilter(
  variants: Array<{ obtained?: boolean }>,
  filter: ObtainedFilter | null
): boolean {
  if (!filter) return true
  const fullyObtained = variants.length > 0 && variants.every((v) => v.obtained === true)
  return filter === 'obtained' ? fullyObtained : !fullyObtained
}

export function isGlowup(row: { order: number }): boolean {
  return row.order === 0
}

// Display order: base (1) -> evolutions (2,3,...) -> glow-up (0, last).
export function evolutionSortKey(row: { order: number }): number {
  return row.order === 0 ? Infinity : row.order
}

// Derived default title for a glow-up variant with no stored title:
// "{base variant title}: {glow-up set title}", e.g. "Gifted Sunlight: Light Pursuer".
// Returns null when the base variant has no usable title (or the glow-up set has
// no title) — callers then leave the variant title untouched.
export function deriveGlowupVariantTitle({
  baseVariantTitle,
  glowupSetTitle,
}: {
  baseVariantTitle: string | null | undefined
  glowupSetTitle: string | null | undefined
}): string | null {
  const base = baseVariantTitle?.trim()
  const glowup = glowupSetTitle?.trim()
  if (!base || !glowup) return null
  return `${base}: ${glowup}`
}

export function isBaseRow(row: { base_set: string | null }): boolean {
  return row.base_set === null
}

export function sortOutfitVariants(
  variants: OutfitVariant[],
  defaultStateSlug: string | null | undefined,
  categoryOrder: string[]
): OutfitVariant[] {
  return [...variants].sort((a, b) => {
    if (a.outfit_set === defaultStateSlug && b.outfit_set !== defaultStateSlug) return -1
    if (b.outfit_set === defaultStateSlug && a.outfit_set !== defaultStateSlug) return 1
    if (a.outfit_set !== b.outfit_set) return 0
    return (
      categoryOrder.indexOf(a.outfit_category ?? '') -
      categoryOrder.indexOf(b.outfit_category ?? '')
    )
  })
}

// Decide whether a variant's evolution should be visible given the independent
// "hide evolutions" and "hide glowups" toggles. The base state is always shown;
// the glow-up state is governed solely by hideGlowups, and every other
// (non-base, non-glowup) evolution solely by hideEvolutions — so the two
// toggles never affect each other.
export function isEvolutionVisible({
  stateSlug,
  baseSlug,
  isGlowupState,
  hideEvolutions,
  hideGlowups,
}: {
  stateSlug: string | null
  baseSlug: string
  isGlowupState: boolean
  hideEvolutions: boolean
  hideGlowups: boolean
}): boolean {
  if (stateSlug === baseSlug) return true
  if (isGlowupState) return !hideGlowups
  return !hideEvolutions
}

export function createOutfitSet({
  outfitSet,
  outfitCategories,
  evolutions,
}: {
  outfitSet: Omit<OutfitSet, 'created_at' | 'outfit_categories' | 'evolutions'>
  outfitCategories: OutfitCategory[] | null
  evolutions: Evolution[] | null
}): OutfitSet {
  const categoryOrder = (outfitCategories ?? []).map((c) => c.slug)
  const baseSlug = outfitSet.slug

  // Evolutions of this set = rows whose base_set points back to it, in display order.
  const resolvedEvolutions = (evolutions ?? [])
    .filter((e) => e.base_set === baseSlug)
    .sort((a, b) => evolutionSortKey(a) - evolutionSortKey(b))

  // The base row's embed carries only base-state variants (outfit_set = baseSlug).
  // Each evolution sibling carries its own variants (outfit_set = its slug). Merge
  // them so consumers can group `outfit_variants` by state slug (base + each evo).
  const allVariants = [
    ...outfitSet.outfit_variants,
    ...resolvedEvolutions.flatMap((e) => e.outfit_variants ?? []),
  ]

  return {
    ...outfitSet,
    image_url:
      outfitSet.image_url ??
      allVariants.find((v) => v.outfit_set === baseSlug && v.outfit_category === 'hair')
        ?.image_url ??
      allVariants.find((v) => v.outfit_set === baseSlug)?.image_url,
    outfit_categories: outfitCategories ?? [],
    evolutions: resolvedEvolutions,
    outfit_variants: sortOutfitVariants(allVariants as OutfitVariant[], baseSlug, categoryOrder),
  } as OutfitSet
}

export function updateOutfitSet({
  outfitSet,
  obtainedOutfit,
}: {
  outfitSet: OutfitSet
  obtainedOutfit: ObtainedOutfit[] | null
}): OutfitSet {
  return {
    ...outfitSet,
    outfit_variants: outfitSet.outfit_variants.map((variant) => ({
      ...variant,
      obtained: !!obtainedOutfit?.find((o) => o.outfit_variant === variant.slug),
    })) as OutfitVariant[],
  } as OutfitSet
}

export function updateOutfitVariants({
  outfitVariants,
  obtainedOutfit,
}: {
  outfitVariants: OutfitVariant[]
  obtainedOutfit: ObtainedOutfit[] | null
}): OutfitVariant[] {
  return outfitVariants.map((variant) => ({
    ...variant,
    obtained: !!obtainedOutfit?.find((o) => o.outfit_variant === variant.slug),
  })) as OutfitVariant[]
}
