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
	image_url,
	alt_image_url,
	created_at,
	updated_at
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
    .select(CLOAK_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  return (data as MomoCloak) ?? null
})
