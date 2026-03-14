import { cache } from 'react'

import { Style } from '@/lib/types/eureka'
import { createClient } from '@/lib/supabase/server'

export const getStyles = cache(async () => {
  const supabase = await createClient()

  const { data: styles } = await supabase
    .from('styles')
    .select('slug, title')
    .not('title', 'is', null)
    .order('title', { ascending: true })

  return (styles ?? []) as Style[]
})
