import { createClient } from '@/lib/supabase/server'
import { MakeupSetRaw } from '@/lib/types/makeup'
import { cache } from 'react'

const RAW_COLUMNS = `
	id,
	slug,
	title,
	description,
	rarity,
	style,
	seasons,
	season_category,
	outfit_set,
	"order",
	base_set,
	image_url,
	alt_image_url,
	updated_at
`

export const getMakeupSetsRaw = cache(async () => {
  const supabase = await createClient()

  const { data: makeupSets } = await supabase
    .from('makeup_sets')
    .select(RAW_COLUMNS)
    .order('updated_at', { ascending: false, nullsFirst: false })

  return (makeupSets ?? []) as MakeupSetRaw[]
})

export const getMakeupSetRaw = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: makeupSet } = await supabase
    .from('makeup_sets')
    .select(RAW_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  return makeupSet as MakeupSetRaw | null
})
