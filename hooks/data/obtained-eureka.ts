import { createClient } from '@/lib/supabase/server'
import { ObtainedEureka, RecentObtained } from '@/lib/types/eureka'
import { UUID } from 'crypto'
import { cache } from 'react'
import { fetchAllRows } from './fetch-all-rows'

export const getObtainedEureka = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  // Page through every row — a large collection exceeds PostgREST's 1000-row cap.
  return fetchAllRows<ObtainedEureka>((from, to) =>
    supabase
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
      .order('id', { ascending: true })
      .range(from, to)
  )
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
			eureka_categories ( title ),
			eureka_colors ( title )
		`
    )
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(5)

  return data as RecentObtained[]
})
