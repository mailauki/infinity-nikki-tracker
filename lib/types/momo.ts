import { EvolvableLinkedSet } from './outfit'
import { Tables } from './supabase'

// Every cloak's stored title carries this prefix (e.g. "Momo’s Cloak: Dream"),
// so the add form shows it as a fixed input adornment and prepends it on save
// rather than making admins retype it. The apostrophe is U+2019 (’), matching
// the existing rows — a straight ' would store a title that doesn't match them.
// toSlug() strips both forms, so slugs are unaffected either way.
export const MOMO_CLOAK_TITLE_PREFIX = 'Momo’s Cloak: '

/** Prepend the cloak title prefix unless it's already present. */
export function withMomoCloakPrefix(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) return ''
  return trimmed.startsWith(MOMO_CLOAK_TITLE_PREFIX)
    ? trimmed
    : `${MOMO_CLOAK_TITLE_PREFIX}${trimmed}`
}

// Momo's Cloaks are a flat domain: one row per cloak, with no variants,
// categories, or evolutions. So there is no Raw/resolved split like makeup and
// outfits need — the DB row is already the whole thing.
export type MomoCloak = Tables<'momo_cloaks'> & {
  // Resolved lookup titles; the columns themselves hold slugs.
  season?: { title: string } | null
  seasonCategory?: { title: string } | null
  // The associated outfit, mirroring MakeupSet.outfitSet. Populated only by
  // getMomoCloak (the detail query) — the list query has no use for the join,
  // so this stays optional and reads as undefined there.
  outfitSet?: EvolvableLinkedSet | null
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
  | 'location'
  | 'outfit_set'
  | 'image_url'
  | 'alt_image_url'
  | 'updated_at'
>

export type ObtainedMomoCloak = Pick<Tables<'obtained_momo_cloaks'>, 'id' | 'momo_cloak'>

// Cloaks are flat, so the obtained row embeds the cloak itself — there is no
// set/category/variant hierarchy to resolve alongside it.
export type RecentObtainedMomoCloak = Pick<
  Tables<'obtained_momo_cloaks'>,
  'id' | 'momo_cloak' | 'created_at'
> & {
  momo_cloaks: { slug: string; title: string; image_url: string | null; rarity: number } | null
}
