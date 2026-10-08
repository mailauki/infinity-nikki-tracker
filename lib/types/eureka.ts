import { Release } from '@/hooks/release'
import { Tables } from './supabase'

// The public eureka-sets selects (hooks/data/eureka-sets.ts) also embed
// `trials ( released_at, version )` on this join row to resolve
// EurekaSet.release — this type stays narrower (trial slug only) since it's
// the shape most callers (admin raw rows, etc.) actually need.
export type EurekaSetTrial = Pick<Tables<'eureka_set_trials'>, 'trial'>

export type EurekaSet = Tables<'eureka_sets'> & {
  image_url: string
  eureka_variants: EurekaVariant[]
  eureka_set_trials: EurekaSetTrial[]
  categories: EurekaCategory[]
  colors: EurekaColor[]
  // The fully resolved release: this set's own override, falling back to the
  // earliest of the trials it drops from. See hooks/release.ts.
  release: Release
}

export type EurekaSetRaw = Pick<
  Tables<'eureka_sets'>,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'rarity'
  | 'style'
  | 'label'
  | 'updated_at'
  | 'released_at'
  | 'version'
  | 'seasons'
> & {
  eureka_set_trials: EurekaSetTrial[]
}

export type EurekaVariantRaw = Pick<
  Tables<'eureka_variants'>,
  'id' | 'slug' | 'eureka_set' | 'color' | 'category' | 'image_url' | 'default' | 'updated_at'
> & {
  eureka_sets: { title: string } | null
  eureka_categories: { title: string } | null
  eureka_colors: { title: string | null } | null
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
  eureka_categories: { title: string } | null
  eureka_colors: { title: string | null } | null
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

export type EurekaCategory = Pick<Tables<'eureka_categories'>, 'slug' | 'title' | 'image_url'>

export type EurekaColor = Pick<Tables<'eureka_colors'>, 'slug' | 'title' | 'image_url'>

export type Style = Pick<Tables<'styles'>, 'slug' | 'title'>

export type Label = Pick<Tables<'labels'>, 'slug' | 'title'>

export type Trial = Pick<
  Tables<'trials'>,
  | 'id'
  | 'slug'
  | 'title'
  | 'image_url'
  | 'realm'
  | 'description'
  | 'location'
  | 'updated_at'
  | 'released_at'
  | 'version'
>
