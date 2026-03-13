import { cache } from 'react'

import { Category } from '@/lib/types/eureka'
import { createClient } from '@/lib/supabase/server'

export const getCategories = cache(async () => {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('slug, title, image_url')
    .order('id', { ascending: true })

  return (categories ?? []) as Category[]
})
