import { cache } from 'react'

import { Color } from '@/lib/types/eureka'
import { createClient } from '@/lib/supabase/server'

export const getEurekaColors = cache(async () => {
  const supabase = await createClient()

  const { data: colors } = await supabase
    .from('colors')
    .select('slug, title, image_url')
    .order('id', { ascending: true })

  return (colors ?? []) as Color[]
})
