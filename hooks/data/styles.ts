import { cacheLife } from 'next/cache'

import { publicClient } from '@/lib/supabase/public'
import { Style } from '@/lib/types/eureka'

export async function getStyles() {
  'use cache'
  cacheLife('days')

  const { data: styles } = await publicClient
    .from('styles')
    .select('title')
    .not('title', 'is', null)
    .order('title', { ascending: true })

  return styles as Style[]
}
