import { Tables } from './supabase'

export type EurekaSet = Tables<'eureka_sets'> & {
  image_url: string
  eureka_variants: EurekaVariant[]
  categories: Category[]
  colors: Color[]
}

export type EurekaSetRaw = Pick<
  Tables<'eureka_sets'>,
  'id' | 'slug' | 'title' | 'rarity' | 'trial' | 'style' | 'label' | 'updated_at'
>

export type EurekaVariantRaw = Pick<
  Tables<'eureka_variants'>,
  'id' | 'slug' | 'eureka_set' | 'color' | 'category' | 'image_url' | 'default' | 'updated_at'
>

export type EurekaVariant = Pick<
  Tables<'eureka_variants'>,
  'id' | 'slug' | 'eureka_set' | 'color' | 'category' | 'image_url' | 'default'
> & { obtained?: boolean }

export type Obtained = Pick<Tables<'obtained_eureka'>, 'id' | 'eureka_set' | 'category' | 'color'>

export interface ObtainedCount {
  obtained: number
  total: number
}

export interface Total {
  title: string
  slug: string
  image_url: string | null
  eurekaSets?: EurekaSet[]
}

export type Category = Pick<Tables<'categories'>, 'slug' | 'title' | 'image_url'>

export type Color = Pick<Tables<'colors'>, 'slug' | 'title' | 'image_url'>

export type Style = Pick<Tables<'styles'>, 'slug' | 'title'>

export type Label = Pick<Tables<'labels'>, 'slug' | 'title'>

export type Trial = Pick<Tables<'trials'>, 'id' | 'slug' | 'title' | 'image_url' | 'updated_at'>
