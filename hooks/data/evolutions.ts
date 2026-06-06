import { cache } from 'react'
import { Evolution } from '@/lib/types/outfit'
import { createClient } from '@/lib/supabase/server'

export const getEvolutions = cache(async () => {
  const supabase = await createClient()

  const { data: evolutions } = await supabase
    .from('evolutions')
    .select('slug, title, subtitle, description, order, outfit_set, image_url, alt_image_url')
    .order('order', { ascending: true })

  return (evolutions ?? []) as Evolution[]
})

export const getEvolutionsBySet = cache(async (outfitSetSlug: string) => {
  const supabase = await createClient()

  const { data: evolutions } = await supabase
    .from('evolutions')
    .select('slug, title, subtitle, description, order, outfit_set, image_url, alt_image_url')
    .eq('outfit_set', outfitSetSlug)
    .order('order', { ascending: true })

  return (evolutions ?? []) as Evolution[]
})
