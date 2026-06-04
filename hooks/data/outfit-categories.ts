import { cache } from 'react'
import { OutfitCategory } from '@/lib/types/outfit'
import { createClient } from '@/lib/supabase/server'

export const getOutfitCategories = cache(async () => {
  const supabase = await createClient()

  const { data: outfitCategories } = await supabase
    .from('outfit_categories')
    .select('slug, title, part')
    .order('id', { ascending: true })

  return (outfitCategories ?? []) as OutfitCategory[]
})
