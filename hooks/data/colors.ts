import { cacheLife } from 'next/cache'

import { createPublicClient } from '../../lib/supabase/public'
import { Color } from '../../lib/types/eureka'

export async function getColors() {
  'use cache'
  cacheLife('days')

  const supabase = createPublicClient()

  const { data: colors } = await supabase
    .from('colors')
    .select('title, image_url')
    .order('id', { ascending: true })

  return colors as Color[]
}
