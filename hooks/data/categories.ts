import { createClient } from '@/lib/supabase/server'
import { Category } from '@/lib/types/eureka'
import { cache } from 'react'

export const getCategories = cache(async () => {
  const supabase = await createClient()

  const { data: categories } = await supabase.from('categories').select('title, image_url')

  return categories as Category[]
})
