import type { EurekaCategory, EurekaSet } from './types/eureka'
import type { OutfitCategory, OutfitSet } from './types/outfit'
import type { FlatVariant } from './types/looks'
import { toTitle } from './utils'

function categoryTitleMap(categories: { slug: string; title: string }[]) {
  return new Map(categories.map((c) => [c.slug, c.title]))
}

// Category slugs whose icon filename in public/icons/categories/ doesn't follow
// the default `slug.replace(/_/g, '-')` rule. Slugs absent here and from the
// folder (e.g. body_paint, eureka head/hands/feet) resolve to undefined.
const CATEGORY_ICON_FILES: Record<string, string> = {
  dress: 'dresses',
  back_pieces: 'backpieces',
}
const CATEGORY_ICON_SLUGS = new Set([
  'hair',
  'outerwear',
  'tops',
  'bottoms',
  'socks',
  'shoes',
  'hair_accessories',
  'headwear',
  'earrings',
  'neckwear',
  'bracelets',
  'chokers',
  'gloves',
  'face_decorations',
  'chest_accessories',
  'pendants',
  'rings',
  'arm_decorations',
  'handhelds',
  ...Object.keys(CATEGORY_ICON_FILES),
])

/** Local icon path for a category slug, or undefined when no icon exists. */
export function categoryIconSrc(slug: string): string | undefined {
  if (!CATEGORY_ICON_SLUGS.has(slug)) return undefined
  const file = CATEGORY_ICON_FILES[slug] ?? slug.replace(/_/g, '-')
  return `/icons/categories/${file}.png`
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
  const parts = new Map(categories.map((c) => [c.slug, c.part]))
  return sets.flatMap((set) =>
    set.outfit_variants.map((v) => ({
      slug: v.slug,
      type: 'outfit' as const,
      setTitle: set.title,
      setSlug: set.slug,
      category: v.outfit_category ?? '',
      categoryTitle: titles.get(v.outfit_category ?? '') ?? toTitle(v.outfit_category ?? ''),
      part: parts.get(v.outfit_category ?? '') ?? undefined,
      evolution: v.evolution ?? undefined,
      image_url: v.image_url,
    }))
  )
}
