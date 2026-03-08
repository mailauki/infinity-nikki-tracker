import { cacheLife } from 'next/cache'

import { publicClient } from '@/lib/supabase/public'
import { Label } from '@/lib/types/eureka'

export async function getLabels() {
  'use cache'
  cacheLife('days')

  const { data: labels } = await publicClient
    .from('labels')
    .select('title')
    .not('title', 'is', null)
    .order('title', { ascending: true })

  return labels as Label[]
}
