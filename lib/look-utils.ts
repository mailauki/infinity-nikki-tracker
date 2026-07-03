import type { EurekaCategory, EurekaSet } from './types/eureka'
import type { OutfitCategory, OutfitSet } from './types/outfit'
import type { FlatVariant } from './types/looks'
import { toTitle } from './utils'

function categoryTitleMap(categories: { slug: string; title: string }[]) {
  return new Map(categories.map((c) => [c.slug, c.title]))
}

// Every real category slug (outfit + eureka) that has an icon in
// public/icons/categories/. The file name is the slug with underscores
// swapped for hyphens (e.g. back_pieces -> back-pieces.png). Slugs absent
// here (non-categories) resolve to undefined.
const CATEGORY_ICON_SLUGS = new Set([
  'hair',
  'dresses',
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
  'body_paint',
  'back_pieces',
  // eureka categories
  'head',
  'hands',
  'feet',
])

/** Local icon path for a category slug, or undefined when no icon exists. */
export function categoryIconSrc(slug: string): string | undefined {
  if (!CATEGORY_ICON_SLUGS.has(slug)) return undefined
  return `/icons/categories/${slug.replace(/_/g, '-')}.png`
}

// Every eureka color slug that has an icon in public/icons/categories/.
const COLOR_ICON_SLUGS = new Set([
  'blue',
  'green',
  'iridescent',
  'pink',
  'purple',
  'red',
  'white',
  'yellow',
])

/** Local icon path for a color slug, or undefined when no icon exists. */
export function colorIconSrc(slug: string): string | undefined {
  if (!COLOR_ICON_SLUGS.has(slug)) return undefined
  return `/icons/categories/${slug}.png`
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
      title: v.title,
      part: parts.get(v.outfit_category ?? '') ?? undefined,
      // Derive the evolution label from outfit_set: null when this is the base
      // state (variant belongs to the base row), otherwise the evolution slug.
      evolution: v.outfit_set !== set.slug ? v.outfit_set : undefined,
      image_url: v.image_url,
    }))
  )
}
