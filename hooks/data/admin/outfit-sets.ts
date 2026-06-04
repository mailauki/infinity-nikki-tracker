import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { OutfitSetRaw } from '@/lib/types/outfit'

export const getOutfitSetsRaw = cache(async () => {
  const supabase = await createClient()

  const { data: outfitSets } = await supabase
    .from('outfit_sets')
    .select('id, slug, title, description, rarity, style, label, ability, updated_at')
    .order('updated_at', { ascending: false, nullsFirst: false })

  return (outfitSets ?? []) as OutfitSetRaw[]
})

export const getOutfitSetRaw = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: outfitSet } = await supabase
    .from('outfit_sets')
    .select('id, slug, title, description, rarity, style, label, ability, updated_at')
    .eq('slug', slug)
    .maybeSingle()

  return outfitSet as OutfitSetRaw | null
})
