import { cacheLife } from 'next/cache'

import { publicClient } from '@/lib/supabase/public'
import { Color } from '@/lib/types/eureka'

export async function getColors() {
  'use cache'
  cacheLife('days')

  const { data: colors } = await publicClient
    .from('colors')
    .select('title, image_url')
    .order('id', { ascending: true })

  return colors as Color[]
}
