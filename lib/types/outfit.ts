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

export type Evolution = Pick<
  Tables<'evolutions'>,
  | 'id'
  | 'slug'
  | 'title'
  | 'subtitle'
  | 'description'
  | 'order'
  | 'outfit_set'
  | 'image_url'
  | 'alt_image_url'
> & {
  carousel_images: CarouselImage[]
  // Populated only by admin hooks that embed variants (e.g. the evolutions
  // admin table); the public/data pipeline leaves this undefined.
  outfit_variants?: OutfitVariant[]
}

export type EvolutionDraft = {
  subtitle: string
  order: number
  existingSlug?: string
}

export type CarouselImage = Pick<
  Tables<'outfit_set_carousel_images'>,
  'id' | 'image_url' | 'sort_order'
>

export type OutfitSet = Tables<'outfit_sets'> & {
  image_url: string | null | undefined
  outfit_variants: OutfitVariant[]
  outfit_categories: OutfitCategory[]
  evolutions: Evolution[]
  carousel_images: CarouselImage[]
  season: { title: string } | null
  seasonCategory: { title: string } | null
}

export type OutfitSetRaw = Pick<
  Tables<'outfit_sets'>,
  | 'id'
  | 'slug'
  | 'title'
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
  | 'glowup_evolution'
  | 'updated_at'
>

export type OutfitVariant = Pick<
  Tables<'outfit_variants'>,
  | 'id'
  | 'slug'
  | 'outfit_set'
  | 'evolution'
  | 'outfit_category'
  | 'title'
  | 'image_url'
  | 'alt_image_url'
  | 'default'
> & { obtained?: boolean }

export type ObtainedOutfit = Pick<
  Tables<'obtained_outfit'>,
  'id' | 'outfit_set' | 'outfit_category' | 'evolution'
>

export type RecentObtainedOutfit = Pick<
  Tables<'obtained_outfit'>,
  'id' | 'outfit_set' | 'outfit_category' | 'evolution' | 'created_at'
> & {
  outfit_sets: {
    title: string
    outfit_variants: {
      image_url: string | null
      outfit_category: string | null
      evolution: string | null
    }[]
  } | null
  outfit_categories: { title: string } | null
  evolutions: { title: string } | null
}
