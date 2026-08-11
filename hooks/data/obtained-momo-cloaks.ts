import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ObtainedMomoCloak, RecentObtainedMomoCloak } from '@/lib/types/momo'
import { UUID } from 'crypto'
import { fetchAllRows } from './fetch-all-rows'

export const getObtainedMomoCloaks = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  // Page through every row — a large collection exceeds PostgREST's 1000-row cap.
  return fetchAllRows<ObtainedMomoCloak>((from, to) =>
    supabase
      .from('obtained_momo_cloaks')
      .select('id, momo_cloak')
      .eq('user_id', user_id)
      .order('id', { ascending: true })
      .range(from, to)
  )
})

export const getRecentObtainedMomoCloaks = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('obtained_momo_cloaks')
    .select(
      `
				id,
				momo_cloak,
				created_at,
				momo_cloaks ( slug, title, image_url, rarity )
			`
    )
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(5)

  return data as RecentObtainedMomoCloak[]
})
