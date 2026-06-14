import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ObtainedOutfit } from '@/lib/types/outfit'
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
