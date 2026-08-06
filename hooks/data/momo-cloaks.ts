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

// getMomoCloak only: the list query has no use for the outfit join. `outfit_set`
// is a slug FK, so this resolves the referenced row for display.
const CLOAK_DETAIL_COLUMNS = `
	${CLOAK_COLUMNS},
	outfit_set,
	outfitSet:outfit_sets!momo_cloaks_outfit_set_fkey ( slug, title, image_url )
`

export const getMomoCloaks = cache(async () => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('momo_cloaks')
    .select(CLOAK_COLUMNS)
    .order('title', { ascending: true })

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
