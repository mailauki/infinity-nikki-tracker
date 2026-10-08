import { createClient } from '@/lib/supabase/server'
import { EurekaSetRaw } from '@/lib/types/eureka'
import { cache } from 'react'

export const getEurekaSetsRaw = cache(async () => {
  const supabase = await createClient()

  const { data: eurekaSets } = await supabase
    .from('eureka_sets')
    .select(
      `
			id,
			slug,
			title,
			description,
			rarity,
			style,
			label,
			updated_at,
			released_at,
			version,
			seasons,
			eureka_set_trials ( trial )
			`
    )
    .order('updated_at', { ascending: false, nullsFirst: false })

  return eurekaSets as EurekaSetRaw[]
})
