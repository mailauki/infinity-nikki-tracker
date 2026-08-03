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
  | 'label'
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
  | 'label'
  | 'default'
  | 'image_url'
  | 'alt_image_url'
> & { obtained?: boolean }

export type MakeupVariantRaw = Tables<'makeup_variants'> & {
  makeup_sets: { title: string } | null
  makeup_categories: { title: string | null } | null
}

export type MakeupSet = Tables<'makeup_sets'> & {
  makeup_variants: MakeupVariant[]
  // Not yet populated by createMakeupSet — always [] until the public makeup
  // pages wire up category resolution. Optional so a future consumer gets a
  // compile-time signal instead of a silent [].
  makeup_categories?: MakeupCategory[]
  evolutions: MakeupEvolution[]
  season: { title: string } | null
  seasonCategory: { title: string } | null
  // Not yet populated by createMakeupSet — always null until the public
  // makeup pages wire up the outfit-set join. Optional so a future consumer
  // gets a compile-time signal instead of a silent null.
  outfitSet?: { slug: string; title: string; image_url: string | null } | null
}

// A makeup evolution is just a makeup_sets row with base_set IS NOT NULL
// (order >= 2). Same shape as the base set, mirroring `Evolution = OutfitSet`.
export type MakeupEvolution = MakeupSet

export type ObtainedMakeup = Pick<
  Tables<'obtained_makeup'>,
  'id' | 'makeup_set' | 'makeup_category' | 'makeup_variant'
>
