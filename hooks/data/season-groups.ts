import { cache } from 'react'
import { SeasonGroup } from '@/lib/types/outfit'
import { createClient } from '@/lib/supabase/server'

export const getSeasonGroups = cache(async () => {
  const supabase = await createClient()

  const { data: seasonGroups } = await supabase
    .from('season_groups')
    .select('id, slug, title, image_url, description')
    .order('id', { ascending: true })

  return (seasonGroups ?? []) as SeasonGroup[]
})
