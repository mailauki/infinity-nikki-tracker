import type { EurekaCategory, EurekaSet } from './types/eureka'
import type { OutfitCategory, OutfitSet } from './types/outfit'
import type { FlatVariant } from './types/looks'
import { toTitle } from './utils'

function categoryTitleMap(categories: { slug: string; title: string }[]) {
  return new Map(categories.map((c) => [c.slug, c.title]))
}

export function flattenEurekaVariants(
  sets: EurekaSet[],
  categories: EurekaCategory[]
): FlatVariant[] {
  const titles = categoryTitleMap(categories)
  return sets.flatMap((set) =>
    set.eureka_variants.map((v) => ({
      slug: v.slug,
      type: 'eureka' as const,
      setTitle: set.title,
      setSlug: set.slug,
      category: v.category ?? '',
      categoryTitle: titles.get(v.category ?? '') ?? toTitle(v.category ?? ''),
      color: v.color ?? undefined,
      image_url: v.image_url,
    }))
  )
}

export function flattenOutfitVariants(
  sets: OutfitSet[],
  categories: OutfitCategory[]
): FlatVariant[] {
  const titles = categoryTitleMap(categories)
  return sets.flatMap((set) =>
    set.outfit_variants.map((v) => ({
      slug: v.slug,
      type: 'outfit' as const,
      setTitle: set.title,
      setSlug: set.slug,
      category: v.outfit_category ?? '',
      categoryTitle: titles.get(v.outfit_category ?? '') ?? toTitle(v.outfit_category ?? ''),
      evolution: v.evolution ?? undefined,
      image_url: v.image_url,
    }))
  )
}
