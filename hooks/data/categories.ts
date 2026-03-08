import { Category } from '@/lib/types/eureka'
import { createClient } from '@/lib/supabase/server'

export async function getCategories() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('title, image_url')
    .order('id', { ascending: true })

  return categories as Category[]
}
