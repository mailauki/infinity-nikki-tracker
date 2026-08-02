import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ObtainedMakeup } from '@/lib/types/makeup'
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
