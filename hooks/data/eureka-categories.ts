import { cacheLife } from 'next/cache'

import { EurekaCategory } from '@/lib/types/eureka'
import { createPublicClient } from '@/lib/supabase/public'

export async function getEurekaCategories() {
  'use cache'
  cacheLife('days')

  const supabase = createPublicClient()

  const { data: categories } = await supabase
    .from('eureka_categories')
    .select('slug, title, image_url')
    .order('id', { ascending: true })

  return (categories ?? []) as EurekaCategory[]
}
