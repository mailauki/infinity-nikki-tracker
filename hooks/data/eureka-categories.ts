import { cache } from 'react'

import { EurekaCategory } from '@/lib/types/eureka'
import { createClient } from '@/lib/supabase/server'

export const getEurekaCategories = cache(async () => {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('eureka_categories')
    .select('slug, title, image_url')
    .order('id', { ascending: true })

  return (categories ?? []) as EurekaCategory[]
})
