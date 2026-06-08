import type { EurekaSet } from './types/eureka'
import type { OutfitSet } from './types/outfit'
import type { FlatVariant } from './types/looks'

export function flattenEurekaVariants(sets: EurekaSet[]): FlatVariant[] {
  return sets.flatMap((set) =>
    set.eureka_variants.map((v) => ({
      slug: v.slug,
      type: 'eureka' as const,
      setTitle: set.title,
      setSlug: set.slug,
      category: v.category ?? '',
      color: v.color ?? undefined,
      image_url: v.image_url,
    }))
  )
}

export function flattenOutfitVariants(sets: OutfitSet[]): FlatVariant[] {
  return sets.flatMap((set) =>
    set.outfit_variants.map((v) => ({
      slug: v.slug,
      type: 'outfit' as const,
      setTitle: set.title,
      setSlug: set.slug,
      category: v.outfit_category ?? '',
      evolution: v.evolution ?? undefined,
      image_url: v.image_url,
    }))
  )
}
