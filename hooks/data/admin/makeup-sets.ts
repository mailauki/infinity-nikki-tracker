import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

const RAW_COLUMNS = '*'

export const getMakeupSetsRaw = cache(async () => {
  const supabase = await createClient()

  const { data: makeupSets } = await supabase
    .from('makeup_sets')
    .select(RAW_COLUMNS)
    .order('updated_at', { ascending: false, nullsFirst: false })

  return makeupSets ?? []
})

export const getMakeupSetRaw = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: makeupSet } = await supabase
    .from('makeup_sets')
    .select(RAW_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  return makeupSet
})
