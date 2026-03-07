import { cacheLife } from 'next/cache'

import { createPublicClient } from '../../lib/supabase/public'
import { Label } from '../../lib/types/eureka'

export async function getLabels() {
  'use cache'
  cacheLife('days')

  const supabase = createPublicClient()

  const { data: labels } = await supabase
    .from('labels')
    .select('title')
    .not('title', 'is', null)
    .order('title', { ascending: true })

  return labels as Label[]
}
