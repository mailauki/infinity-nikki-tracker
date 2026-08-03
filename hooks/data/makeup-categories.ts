import { cache } from 'react'
import { MakeupCategory } from '@/lib/types/makeup'
import { createClient } from '@/lib/supabase/server'

export const getMakeupCategories = cache(async () => {
  const supabase = await createClient()

  const { data: makeupCategories } = await supabase
    .from('makeup_categories')
    .select('slug, title, image_url')
    .order('id', { ascending: true })

  return (makeupCategories ?? []) as MakeupCategory[]
})
