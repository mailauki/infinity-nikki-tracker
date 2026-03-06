import { createClient } from '@/lib/supabase/server'
import { Label } from '@/lib/types/eureka'
import { cache } from 'react'

export const getLabels = cache(async () => {
  const supabase = await createClient()

  const { data: labels } = await supabase
    .from('labels')
    .select('title')
    .not('title', 'is', null)
    .order('title', { ascending: true })

  return labels as Label[]
})
