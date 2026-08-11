import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ObtainedMakeup, RecentObtainedMakeup } from '@/lib/types/makeup'
import { UUID } from 'crypto'
import { fetchAllRows } from './fetch-all-rows'

export const getObtainedMakeup = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  // Page through every row — a large collection exceeds PostgREST's 1000-row cap.
  return fetchAllRows<ObtainedMakeup>((from, to) =>
    supabase
      .from('obtained_makeup')
      .select('id, makeup_set, makeup_category, makeup_variant')
      .eq('user_id', user_id)
      .order('id', { ascending: true })
      .range(from, to)
  )
})

export const getRecentObtainedMakeup = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('obtained_makeup')
    .select(
      `
				id,
				makeup_set,
				makeup_category,
				makeup_variant,
				created_at,
				makeup_variants ( slug, title, image_url ),
				makeup_sets ( title, base_set ),
				makeup_categories ( title )
			`
    )
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(5)

  return data as RecentObtainedMakeup[]
})
