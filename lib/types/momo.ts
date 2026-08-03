import { Tables } from './supabase'

// Momo's Cloaks are a flat domain: one row per cloak, with no variants,
// categories, or evolutions. So there is no Raw/resolved split like makeup and
// outfits need — the DB row is already the whole thing.
export type MomoCloak = Tables<'momo_cloaks'> & {
  // Resolved lookup titles; the columns themselves hold slugs.
  season?: { title: string } | null
  seasonCategory?: { title: string } | null
  obtained?: boolean
}

export type MomoCloakRaw = Pick<
  Tables<'momo_cloaks'>,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'rarity'
  | 'style'
  | 'label'
  | 'seasons'
  | 'season_category'
  | 'image_url'
  | 'alt_image_url'
  | 'updated_at'
>

export type ObtainedMomoCloak = Pick<Tables<'obtained_momo_cloaks'>, 'id' | 'momo_cloak'>
