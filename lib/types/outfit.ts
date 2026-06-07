import { Tables } from './supabase'

export type Ability = Pick<Tables<'abilities'>, 'slug' | 'title'>

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
>

export type EvolutionDraft = {
  subtitle: string
  order: number
  existingSlug?: string
}

export type OutfitSet = Tables<'outfit_sets'> & {
  image_url: string | null | undefined
  outfit_variants: OutfitVariant[]
  outfit_categories: OutfitCategory[]
  evolutions: Evolution[]
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
  | 'image_url'
  | 'alt_image_url'
  | 'default'
> & { obtained?: boolean }

export type OutfitVariantRaw = Pick<
  Tables<'outfit_variants'>,
  | 'id'
  | 'slug'
  | 'outfit_set'
  | 'evolution'
  | 'outfit_category'
  | 'image_url'
  | 'alt_image_url'
  | 'default'
  | 'updated_at'
> & {
  outfit_sets: { title: string } | null
  outfit_categories: { title: string } | null
  evolutions: { title: string | null } | null
}

export type ObtainedOutfit = Pick<
  Tables<'obtained_outfit'>,
  'id' | 'outfit_set' | 'outfit_category' | 'evolution'
>
