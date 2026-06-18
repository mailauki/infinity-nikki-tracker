import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ObtainedOutfit, RecentObtainedOutfit } from '@/lib/types/outfit'
import { UUID } from 'crypto'
import { fetchAllRows } from './fetch-all-rows'

export const getObtainedOutfit = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  // Page through every row — a large collection exceeds PostgREST's 1000-row cap.
  return fetchAllRows<ObtainedOutfit>((from, to) =>
    supabase
      .from('obtained_outfit')
      .select('id, outfit_set, outfit_category, evolution')
      .eq('user_id', user_id)
      .order('id', { ascending: true })
      .range(from, to)
  )
})

export const getRecentObtainedOutfit = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('obtained_outfit')
    .select(
      `
				id,
				outfit_set,
				outfit_category,
				evolution,
				created_at,
				outfit_sets ( title, outfit_variants ( image_url, outfit_category, evolution ) ),
				outfit_categories ( title ),
				evolutions ( title )
			`
    )
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(5)

  return data as RecentObtainedOutfit[]
})
