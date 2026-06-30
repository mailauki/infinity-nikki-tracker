import { createClient } from '@/lib/supabase/server'
import { OutfitVariantRaw } from '@/lib/types/outfit'
import { cache } from 'react'

export const getOutfitVariantsRaw = cache(async () => {
  const supabase = await createClient()

  const { data: outfitVariants } = await supabase
    .from('outfit_variants')
    .select(
      `
      id,
      slug,
      outfit_set,
      outfit_category,
      title,
      description,
      image_url,
      alt_image_url,
      default,
      updated_at,
      outfit_sets ( title ),
      outfit_categories ( title )
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
      outfit_category,
      title,
      description,
      image_url,
      alt_image_url,
      default,
      updated_at,
      outfit_sets ( title ),
      outfit_categories ( title )
      `
    )
    .eq('slug', slug)
    .maybeSingle()

  return (outfitVariant ?? null) as OutfitVariantRaw | null
})
