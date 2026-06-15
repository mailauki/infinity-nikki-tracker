import { cacheLife } from 'next/cache'

import { EurekaColor } from '@/lib/types/eureka'
import { createPublicClient } from '@/lib/supabase/public'

export async function getEurekaColors() {
  'use cache'
  cacheLife('days')

  const supabase = createPublicClient()

  const { data: colors } = await supabase
    .from('eureka_colors')
    .select('slug, title, image_url')
    .order('id', { ascending: true })

  return (colors ?? []) as EurekaColor[]
}
