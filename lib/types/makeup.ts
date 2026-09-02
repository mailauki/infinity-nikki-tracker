import { EvolvableLinkedSet } from './outfit'
import { Tables } from './supabase'

export type MakeupCategory = Pick<Tables<'makeup_categories'>, 'slug' | 'title' | 'image_url'>

export type MakeupSetRaw = Pick<
  Tables<'makeup_sets'>,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'rarity'
  | 'style'
  | 'seasons'
  | 'season_category'
  | 'outfit_set'
  | 'order'
  | 'base_set'
  | 'image_url'
  | 'alt_image_url'
  | 'updated_at'
>

export type MakeupVariant = Pick<
  Tables<'makeup_variants'>,
  | 'id'
  | 'slug'
  | 'makeup_set'
  | 'makeup_category'
  | 'title'
  | 'description'
  | 'rarity'
  | 'style'
  | 'default'
  | 'image_url'
  | 'alt_image_url'
  // Standalone makeup pieces carry their own season the way standalone outfit
  // variants do — their container set has none — so the season pages group them
  // per-variant off these two columns.
  | 'seasons'
  | 'season_category'
> & { obtained?: boolean }

export type MakeupVariantRaw = Tables<'makeup_variants'> & {
  makeup_sets: { title: string } | null
  makeup_categories: { title: string | null } | null
}

export type MakeupSet = Tables<'makeup_sets'> & {
  makeup_variants: MakeupVariant[]
  // Every makeup set carries all five categories (see commit caf8edb8), so this
  // is the lookup list, not a per-set subset. Populated by createMakeupSet().
  makeup_categories: MakeupCategory[]
  evolutions: MakeupEvolution[]
  season: { title: string } | null
  seasonCategory: { title: string } | null
  // The paired outfit set, resolved from makeup_sets.outfit_set. Null when the
  // set has no pairing. Populated by createMakeupSet().
  outfitSet: EvolvableLinkedSet | null
}

// A makeup evolution is just a makeup_sets row with base_set IS NOT NULL
// (order >= 2). Same shape as the base set, mirroring `Evolution = OutfitSet`.
export type MakeupEvolution = MakeupSet

export type ObtainedMakeup = Pick<
  Tables<'obtained_makeup'>,
  'id' | 'makeup_set' | 'makeup_category' | 'makeup_variant'
>

// obtained_makeup.makeup_variant FKs straight to makeup_variants.slug, so the
// variant embeds directly here — unlike RecentObtainedOutfit, which has to
// carry the whole set's variant array and find the matching one client-side.
export type RecentObtainedMakeup = Pick<
  Tables<'obtained_makeup'>,
  'id' | 'makeup_set' | 'makeup_category' | 'makeup_variant' | 'created_at'
> & {
  makeup_variants: { slug: string; title: string | null; image_url: string | null } | null
  // `base_set` is carried so the list can link an evolution row to its base —
  // /makeup/{evolution} 404s, since getMakeupSet resolves base slugs only.
  makeup_sets: { title: string; base_set: string | null } | null
  makeup_categories: { title: string | null } | null
}
