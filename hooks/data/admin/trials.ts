import { createClient } from '@/lib/supabase/server'
import { Trial } from '@/lib/types/eureka'
import { cache } from 'react'

export const getTrialRaw = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: trial } = await supabase
    .from('trials')
    .select('id, slug, title, image_url, updated_at')
    .eq('slug', slug)
    .maybeSingle()

  return trial as Trial
})
