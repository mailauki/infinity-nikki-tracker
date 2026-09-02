import { Tables } from './supabase'

export type Ability = Pick<Tables<'abilities'>, 'slug' | 'title' | 'image_url'>

export type Season = Pick<
  Tables<'seasons'>,
  'id' | 'slug' | 'title' | 'location' | 'image_url' | 'alt_image_url' | 'description'
>

export type SeasonCategory = Pick<
  Tables<'season_categories'>,
  'id' | 'slug' | 'title' | 'image_url' | 'description'
>

export type Location = Pick<Tables<'locations'>, 'slug' | 'title'>

export type OutfitCategory = Pick<Tables<'outfit_categories'>, 'slug' | 'title' | 'part'>

export type EvolutionDraft = {
  subtitle: string
  order: number
  existingSlug?: string
}

export type CarouselImage = Pick<
  Tables<'outfit_set_carousel_images'>,
  'id' | 'image_url' | 'sort_order'
>

/**
 * A sibling item linked to an outfit set by its `outfit_set` FK. Carries both
 * image columns so the mini card can prefer the alt art, matching the detail
 * pages' default image mode.
 *
 * Momo's Cloaks are a flat domain with no evolutions and no `base_set` column,
 * so they use this base shape; outfits and makeup use `EvolvableLinkedSet`.
 */
export type LinkedSet = {
  slug: string
  title: string
  image_url: string | null
  alt_image_url: string | null
}

/**
 * momo_cloaks/makeup_sets point AT outfit_sets, so those embeds come back as
 * arrays even though no outfit row has more than one of either today — nothing
 * at the DB level enforces it. Collapse to the first row (or null) so consumers
 * get a single linked set rather than having to index into an array.
 */
export const firstLinked = <T>(rows: T[] | T | null | undefined): T | null =>
  Array.isArray(rows) ? (rows[0] ?? null) : (rows ?? null)

/** A linked sibling in a domain that has evolutions (outfits, makeup). */
export type EvolvableLinkedSet = LinkedSet & {
  /**
   * The linked row's base slug, or null when the row IS the base. Pairings are
   * evolution-to-evolution for 28 of 68 links (e.g. the `polar_realm_radiance`
   * makeup pairs with `enchanted_encounter-dreamtrail`, not with the base
   * outfit), and evolutions have no page of their own — they render under their
   * base's route via `?evolution=`. So the href needs the base slug, not this
   * row's slug. Resolve it with `linkedSetHref()` rather than inlining.
   */
  base_set: string | null
}

/**
 * Build the detail-page href for a linked sibling, pointing at the specific
 * evolution the pairing refers to.
 *
 * Evolutions have no route of their own: `/outfits/[slug]` and `/makeup/[slug]`
 * both load the BASE row and seed the selection from `?evolution=`. So a link to
 * an evolution addresses the base slug and carries the evolution in the param.
 *
 * The two domains encode that param differently — this mirrors how the grid
 * cards already build their links, and how each detail page resolves them back
 * in `resolveEvolutionSlug`:
 * - outfits (`outfit-set-card.tsx`): slugs are `{base}-{suffix}` and the page
 *   rebuilds `{base}-{param}`, so the param is only the suffix
 * - makeup (`makeup-set-card.tsx`): slugs are opaque and the page uses the param
 *   as-is, so it carries the whole evolution slug
 *
 * A base row links with `?evolution=base`, which both pages resolve to the bare
 * set slug.
 */
export function linkedSetHref(
  domain: 'outfits' | 'makeup',
  linked: Pick<EvolvableLinkedSet, 'slug' | 'base_set'>
): string {
  if (!linked.base_set) return `/${domain}/${linked.slug}?evolution=base`

  // Makeup passes the evolution slug through whole. Outfits strip the `{base}-`
  // prefix, falling back to the full slug if one ever breaks the convention.
  if (domain === 'makeup') return `/makeup/${linked.base_set}?evolution=${linked.slug}`

  const param = linked.slug.startsWith(`${linked.base_set}-`)
    ? linked.slug.slice(linked.base_set.length + 1)
    : linked.slug

  return `/outfits/${linked.base_set}?evolution=${param}`
}

export type OutfitSet = Tables<'outfit_sets'> & {
  image_url: string | null | undefined
  outfit_variants: OutfitVariant[]
  outfit_categories: OutfitCategory[]
  evolutions: Evolution[]
  carousel_images: CarouselImage[]
  season: { title: string } | null
  seasonCategory: { title: string } | null
  // Reverse FK lookups (momo_cloaks.outfit_set / makeup_sets.outfit_set).
  // Populated only by getOutfitSet — the list query has no use for them.
  // Nothing enforces one-per-outfit at the DB level, so the query returns an
  // array and the data layer normalizes it to the first row.
  momoCloak?: LinkedSet | null
  makeupSet?: EvolvableLinkedSet | null
}

// An evolution is now just an outfit_sets row with base_set IS NOT NULL
// (i.e. order >= 2 for regular evolutions, order = 0 for glow-ups).
export type Evolution = OutfitSet

export type OutfitSetRaw = Pick<
  Tables<'outfit_sets'>,
  | 'id'
  | 'slug'
  | 'title'
  | 'subtitle'
  | 'description'
  | 'rarity'
  | 'style'
  | 'label'
  | 'label_2'
  | 'ability'
  | 'seasons'
  | 'season_category'
  | 'image_url'
  | 'alt_image_url'
  | 'order'
  | 'base_set'
  | 'handheld_base_only'
  | 'updated_at'
>

export type OutfitVariant = Pick<
  Tables<'outfit_variants'>,
  | 'id'
  | 'slug'
  | 'outfit_set'
  | 'outfit_category'
  | 'title'
  | 'image_url'
  | 'alt_image_url'
  | 'default'
  | 'rarity'
  | 'style'
  | 'seasons'
  | 'season_category'
> & { obtained?: boolean }

export type OutfitVariantRaw = Tables<'outfit_variants'> & {
  outfit_sets: { title: string } | null
  outfit_categories: { title: string | null } | null
  season_categories: { title: string | null } | null
}

export type ObtainedOutfit = Pick<
  Tables<'obtained_outfit'>,
  'id' | 'outfit_set' | 'outfit_category' | 'outfit_variant'
>

export type RecentObtainedOutfit = Pick<
  Tables<'obtained_outfit'>,
  'id' | 'outfit_set' | 'outfit_category' | 'outfit_variant' | 'created_at'
> & {
  outfit_sets: {
    title: string
    outfit_variants: {
      slug: string
      image_url: string | null
      outfit_category: string | null
      title: string | null
    }[]
  } | null
  outfit_categories: { title: string } | null
}
