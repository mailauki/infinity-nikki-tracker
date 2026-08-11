import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { MomoCloak } from '@/lib/types/momo'

const CLOAK_COLUMNS = `
	id,
	slug,
	title,
	description,
	rarity,
	style,
	label,
	seasons,
	season_category,
	location,
	image_url,
	alt_image_url,
	created_at,
	updated_at
`

// getMomoCloak only: the list query has no use for these joins. The columns
// themselves hold slugs, so these resolve the referenced rows for display —
// the detail page shows real titles ("Golden Dust") rather than slug-derived
// ones, and populates the `season`/`seasonCategory`/`outfitSet` fields that
// `MomoCloak` declares.
const CLOAK_DETAIL_COLUMNS = `
	${CLOAK_COLUMNS},
	outfit_set,
	outfitSet:outfit_sets!momo_cloaks_outfit_set_fkey ( slug, title, image_url, alt_image_url, base_set ),
	season:seasons!momo_cloaks_seasons_fkey ( title ),
	seasonCategory:season_categories!momo_cloaks_season_category_fkey ( title )
`

export const getMomoCloaks = cache(async () => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('momo_cloaks')
    .select(CLOAK_COLUMNS)
    .order('title', { ascending: true })

  if (error) throw error

  return (data ?? []) as MomoCloak[]
})

export const getMomoCloak = cache(async (slug: string): Promise<MomoCloak | null> => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('momo_cloaks')
    .select(CLOAK_DETAIL_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  return (data as MomoCloak) ?? null
})
