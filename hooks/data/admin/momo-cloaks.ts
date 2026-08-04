import { createClient } from '@/lib/supabase/server'
import { MomoCloakRaw } from '@/lib/types/momo'
import { cache } from 'react'

const RAW_COLUMNS = `
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
	outfit_set,
	image_url,
	alt_image_url,
	updated_at
`

export const getMomoCloaksRaw = cache(async () => {
  const supabase = await createClient()

  const { data: momoCloaks } = await supabase
    .from('momo_cloaks')
    .select(RAW_COLUMNS)
    .order('updated_at', { ascending: false, nullsFirst: false })

  return (momoCloaks ?? []) as MomoCloakRaw[]
})

export const getMomoCloakRaw = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: momoCloak } = await supabase
    .from('momo_cloaks')
    .select(RAW_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  return momoCloak as MomoCloakRaw | null
})
