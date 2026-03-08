import { cacheLife } from 'next/cache'

import { createPublicClient } from '@/lib/supabase/public'
import { Style } from '@/lib/types/eureka'

export async function getStyles() {
  'use cache'
  cacheLife('days')

  const supabase = createPublicClient()

  const { data: styles } = await supabase
    .from('styles')
    .select('title')
    .not('title', 'is', null)
    .order('title', { ascending: true })

  return styles as Style[]
}
