import { cache } from 'react'
import { Season } from '@/lib/types/outfit'
import { createClient } from '@/lib/supabase/server'

export const getSeasons = cache(async () => {
  const supabase = await createClient()

  const { data: seasons } = await supabase
    .from('seasons')
    .select('slug, title')
    .order('title', { ascending: true })

  return (seasons ?? []) as Season[]
})
