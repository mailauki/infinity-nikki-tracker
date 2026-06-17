import { cache } from 'react'
import { SeasonCategory } from '@/lib/types/outfit'
import { createClient } from '@/lib/supabase/server'

export const getSeasonCategories = cache(async () => {
  const supabase = await createClient()

  const { data: seasonCategories } = await supabase
    .from('season_categories')
    .select('id, slug, title, image_url, description')
    .order('id', { ascending: true })

  return (seasonCategories ?? []) as SeasonCategory[]
})
