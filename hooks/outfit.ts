import {
  Evolution,
  OutfitCategory,
  OutfitSet,
  OutfitVariant,
  ObtainedOutfit,
} from '@/lib/types/outfit'
import { ObtainedFilter } from '@/lib/types/props'

// Classify a group of variants by collection progress: 'missing' when none are
// obtained, 'obtained' when all are, 'in-progress' when some (but not all) are.
// An empty group is treated as 'missing'.
export function classifyObtained(
  variants: Array<{ obtained?: boolean }>
): 'missing' | 'in-progress' | 'obtained' {
  if (variants.length === 0) return 'missing'
  const obtainedCount = variants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
  if (obtainedCount === 0) return 'missing'
  if (obtainedCount === variants.length) return 'obtained'
  return 'in-progress'
}

// Whether a group of variants passes the selected set-level obtained filter
// (missing / in-progress / obtained). A null filter passes everything.
export function matchesObtainedFilter(
  variants: Array<{ obtained?: boolean }>,
  filter: ObtainedFilter | null
): boolean {
  if (!filter) return true
  return classifyObtained(variants) === filter
}

// Decide whether a variant's evolution should be visible given the independent
// "hide evolutions" and "hide glowups" toggles. The base set is always shown;
// the glowup (the evolution matching set.glowup_evolution) is governed solely by
// hideGlowups, and every other (non-base, non-glowup) evolution solely by
// hideEvolutions — so the two toggles never affect each other.
export function isEvolutionVisible({
  evolutionSlug,
  baseSlug,
  glowupSlug,
  hideEvolutions,
  hideGlowups,
}: {
  evolutionSlug: string | null
  baseSlug: string
  glowupSlug: string | null
  hideEvolutions: boolean
  hideGlowups: boolean
}): boolean {
  if (evolutionSlug === baseSlug) return true
  if (glowupSlug && evolutionSlug === glowupSlug) return !hideGlowups
  return !hideEvolutions
}

export function sortOutfitVariants(
  variants: OutfitVariant[],
  defaultEvolutionSlug: string | null | undefined,
  categoryOrder: string[]
): OutfitVariant[] {
  return [...variants].sort((a, b) => {
    if (a.evolution === defaultEvolutionSlug && b.evolution !== defaultEvolutionSlug) return -1
    if (b.evolution === defaultEvolutionSlug && a.evolution !== defaultEvolutionSlug) return 1
    if (a.evolution !== b.evolution) return 0
    return (
      categoryOrder.indexOf(a.outfit_category ?? '') -
      categoryOrder.indexOf(b.outfit_category ?? '')
    )
  })
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
  const glowupEvolutionSlug = outfitSet.glowup_evolution ?? null
  const categoryOrder = (outfitCategories ?? []).map((c) => c.slug)

  // Base variants carry the concrete {set}-base evolution slug end-to-end; the
  // base evolution itself (subtitle === 'base') is excluded from the evolution
  // list because it is rendered as the default group, not a selectable evolution.
  const baseEvoSlug = `${outfitSet.slug}-base`

  const evolutionSlugs = [...new Set(outfitSet.outfit_variants.map((v) => v.evolution))]
  const resolvedEvolutions = evolutionSlugs
    .flatMap((slug) =>
      slug && slug !== baseEvoSlug ? (evolutions?.filter((e) => e.slug === slug) ?? []) : []
    )
    .sort((a, b) => a.order - b.order)

  return {
    ...outfitSet,
    image_url:
      outfitSet.image_url ??
      outfitSet.outfit_variants.find(
        (v) => v.evolution === baseEvoSlug && v.outfit_category === 'hair'
      )?.image_url ??
      outfitSet.outfit_variants.find((v) => v.evolution === baseEvoSlug)?.image_url,
    outfit_categories: outfitCategories ?? [],
    evolutions: resolvedEvolutions,
    outfit_variants: sortOutfitVariants(
      outfitSet.outfit_variants as OutfitVariant[],
      glowupEvolutionSlug,
      categoryOrder
    ),
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
      obtained: !!obtainedOutfit?.find(
        (o) =>
          variant.outfit_set === o.outfit_set &&
          variant.outfit_category === o.outfit_category &&
          variant.evolution === o.evolution
      ),
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
    obtained: !!obtainedOutfit?.find(
      (o) =>
        variant.outfit_set === o.outfit_set &&
        variant.outfit_category === o.outfit_category &&
        variant.evolution === o.evolution
    ),
  })) as OutfitVariant[]
}
