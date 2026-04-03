import { createClient } from '@/lib/supabase/server'
import { ObtainedEureka, RecentObtained } from '@/lib/types/eureka'
import { UUID } from 'crypto'
import { cache } from 'react'

export const getObtainedEureka = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  const { data: obtainedEureka } = await supabase
    .from('obtained_eureka')
    .select(
      `
			id,
			eureka_set,
			category,
			color
		`
    )
    .eq('user_id', user_id)

  return obtainedEureka as ObtainedEureka[]
})

export const getRecentObtained = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('obtained_eureka')
    .select(
      `
			id,
			eureka_set,
			category,
			color,
			created_at,
			eureka_sets ( title, eureka_variants ( image_url, category, color ) ),
			categories ( title ),
			colors ( title )
		`
    )
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(5)

  return data as RecentObtained[]
})
