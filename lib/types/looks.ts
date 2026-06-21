import { Tables } from './supabase'

export type CustomLook = Pick<
  Tables<'custom_looks'>,
  | 'id'
  | 'user_id'
  | 'name'
  | 'description'
  | 'image_url'
  | 'slug'
  | 'eureka_variant_slugs'
  | 'outfit_variant_slugs'
  | 'created_at'
  | 'updated_at'
>

export type FlatVariant = {
  slug: string
  type: 'eureka' | 'outfit'
  setTitle: string
  setSlug: string
  category: string
  categoryTitle: string
  part?: string
  color?: string
  evolution?: string | null
  image_url: string | null
}

export const FREE_LOOKS_LIMIT = 5
