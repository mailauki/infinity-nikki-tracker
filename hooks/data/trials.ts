import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { Trial } from '@/lib/types/eureka'

export const getTrials = cache(async () => {
  const supabase = await createClient()

  const { data: trials } = await supabase
    .from('trials')
    .select('id, slug, title, image_url, updated_at')
    .order('id', { ascending: true })

  return (trials ?? []) as Trial[]
})

export const getTrial = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: trial } = await supabase
    .from('trials')
    .select('id, slug, title, image_url, updated_at')
    .eq('slug', slug)
    .maybeSingle()

  return trial as Trial | null
})
