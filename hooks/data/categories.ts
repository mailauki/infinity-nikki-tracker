import { cacheLife } from 'next/cache'

import { createPublicClient } from '../../lib/supabase/public'
import { Category } from '../../lib/types/eureka'

export async function getCategories() {
  'use cache'
  cacheLife('days')

  const supabase = createPublicClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('title, image_url')
    .order('id', { ascending: true })

  return categories as Category[]
}
