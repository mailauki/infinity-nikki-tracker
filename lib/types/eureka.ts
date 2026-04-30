import { Tables } from './supabase'

export type EurekaSetTrial = Pick<Tables<'eureka_set_trials'>, 'trial'>

export type EurekaSet = Tables<'eureka_sets'> & {
  image_url: string
  eureka_variants: EurekaVariant[]
  eureka_set_trials: EurekaSetTrial[]
  categories: Category[]
  colors: Color[]
}

export type EurekaSetRaw = Pick<
  Tables<'eureka_sets'>,
  'id' | 'slug' | 'title' | 'rarity' | 'style' | 'label' | 'updated_at'
> & {
  eureka_set_trials: EurekaSetTrial[]
}

export type EurekaVariantRaw = Pick<
  Tables<'eureka_variants'>,
  'id' | 'slug' | 'eureka_set' | 'color' | 'category' | 'image_url' | 'default' | 'updated_at'
> & {
  eureka_sets: { title: string } | null
  categories: { title: string } | null
  colors: { title: string | null } | null
}

export type EurekaVariant = Pick<
  Tables<'eureka_variants'>,
  'id' | 'slug' | 'eureka_set' | 'color' | 'category' | 'image_url' | 'default'
> & { obtained?: boolean }

export type ObtainedEureka = Pick<
  Tables<'obtained_eureka'>,
  'id' | 'eureka_set' | 'category' | 'color'
>

export type RecentObtained = Pick<
  Tables<'obtained_eureka'>,
  'id' | 'eureka_set' | 'category' | 'color' | 'created_at'
> & {
  eureka_sets: {
    title: string
    eureka_variants: { image_url: string | null; category: string | null; color: string | null }[]
  } | null
  categories: { title: string } | null
  colors: { title: string | null } | null
}

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

export type Trial = Pick<Tables<'trials'>, 'id' | 'slug' | 'title' | 'image_url' | 'realm' | 'updated_at'>
