import {
  Evolution,
  OutfitCategory,
  OutfitSet,
  OutfitVariant,
  ObtainedOutfit,
} from '@/lib/types/outfit'

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

  // Identify base evolutions (subtitle === 'base', order === 0) so their DB slug
  // can be normalized back to null for all client code.
  const baseEvoSlugs = new Set(
    (evolutions ?? []).filter((e) => e.subtitle === 'base').map((e) => e.slug)
  )

  const normalizedVariants = outfitSet.outfit_variants.map((v) => ({
    ...v,
    evolution: v.evolution !== null && baseEvoSlugs.has(v.evolution) ? null : v.evolution,
  }))

  const evolutionSlugs = [...new Set(normalizedVariants.map((v) => v.evolution))]
  const resolvedEvolutions = evolutionSlugs
    .flatMap((slug) => (slug ? (evolutions?.filter((e) => e.slug === slug) ?? []) : []))
    .sort((a, b) => a.order - b.order)

  return {
    ...outfitSet,
    image_url:
      outfitSet.image_url ??
      normalizedVariants.find((v) => v.evolution === null && v.outfit_category === 'hair')
        ?.image_url ??
      normalizedVariants.find((v) => v.evolution === null)?.image_url,
    outfit_categories: outfitCategories ?? [],
    evolutions: resolvedEvolutions,
    outfit_variants: sortOutfitVariants(
      normalizedVariants as OutfitVariant[],
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
          (variant.evolution === null ? o.evolution === null : variant.evolution === o.evolution)
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
        (variant.evolution === null ? o.evolution === null : variant.evolution === o.evolution)
    ),
  })) as OutfitVariant[]
}
