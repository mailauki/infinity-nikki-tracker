import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { Label } from '@/lib/types/eureka'

export const getLabels = cache(async () => {
  const supabase = await createClient()

  const { data: labels } = await supabase
    .from('labels')
    .select('slug, title')
    .not('title', 'is', null)
    .order('title', { ascending: true })

  return (labels ?? []) as Label[]
})
