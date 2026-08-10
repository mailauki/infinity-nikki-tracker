import { cache } from 'react'
import { MakeupVariant } from '@/lib/types/makeup'
import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from './fetch-all-rows'

export const getMakeupVariants = cache(async () => {
  const supabase = await createClient()

  // Page through every row — PostgREST caps a single response at 1000 rows.
  return fetchAllRows<MakeupVariant>((from, to) =>
    supabase
      .from('makeup_variants')
      .select(
        'id, slug, makeup_set, makeup_category, title, description, rarity, style, default, image_url, alt_image_url'
      )
      .order('id', { ascending: true })
      .range(from, to)
  )
})
