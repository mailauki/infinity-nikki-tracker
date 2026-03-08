import { cacheLife } from 'next/cache'

import { publicClient } from '@/lib/supabase/public'
import { Category } from '@/lib/types/eureka'

export async function getCategories() {
  'use cache'
  cacheLife('days')

  const { data: categories } = await publicClient
    .from('categories')
    .select('title, image_url')
    .order('id', { ascending: true })

  return categories as Category[]
}
