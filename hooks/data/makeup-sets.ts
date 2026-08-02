import { cache } from 'react'
import { MakeupSet, MakeupSetRaw } from '@/lib/types/makeup'
import { createClient } from '@/lib/supabase/server'
import { createMakeupSet } from '@/hooks/makeup'
import { getMakeupVariants } from './makeup-variants'

const SET_COLUMNS = `
	id,
	slug,
	title,
	description,
	rarity,
	style,
	label,
	seasons,
	season_category,
	outfit_set,
	order,
	base_set,
	image_url,
	alt_image_url,
	updated_at
`

export const getMakeupSets = cache(async () => {
  const supabase = await createClient()

  const [{ data: rows }, variants] = await Promise.all([
    supabase.from('makeup_sets').select(SET_COLUMNS).order('title', { ascending: true }),
    getMakeupVariants(),
  ])

  return createMakeupSet((rows ?? []) as MakeupSetRaw[], variants)
})

// Resolves the whole set graph then picks one base set, so the returned set
// carries its evolutions. Passing an evolution's slug returns null by design —
// evolutions are reached through their base set.
export const getMakeupSet = cache(async (slug: string): Promise<MakeupSet | null> => {
  const sets = await getMakeupSets()
  return sets.find((set) => set.slug === slug) ?? null
})
