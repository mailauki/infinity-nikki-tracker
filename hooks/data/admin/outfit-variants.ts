import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { OutfitVariantRaw } from '@/lib/types/outfit'

export const getOutfitVariantsRaw = cache(async () => {
  const supabase = await createClient()

  const { data: outfitVariants } = await supabase
    .from('outfit_variants')
    .select(
      `
      id,
      slug,
      outfit_set,
      evolution,
      outfit_category,
      image_url,
      default,
      updated_at,
      outfit_sets ( title ),
      outfit_categories ( title ),
      evolutions ( title )
      `
    )
    .order('id', { ascending: false })

  return (outfitVariants ?? []) as OutfitVariantRaw[]
})

export const getOutfitVariantRaw = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: outfitVariant } = await supabase
    .from('outfit_variants')
    .select(
      `
      id,
      slug,
      outfit_set,
      evolution,
      outfit_category,
      image_url,
      default,
      updated_at,
      outfit_sets ( title ),
      outfit_categories ( title ),
      evolutions ( title )
      `
    )
    .eq('slug', slug)
    .maybeSingle()

  return outfitVariant as OutfitVariantRaw | null
})
