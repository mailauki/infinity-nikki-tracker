import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getOutfitSetsRaw = cache(async () => {
  const supabase = await createClient()

  const { data: outfitSets } = await supabase
    .from('outfit_sets')
    .select('*')
    .order('updated_at', { ascending: false, nullsFirst: false })

  return outfitSets ?? []
})
