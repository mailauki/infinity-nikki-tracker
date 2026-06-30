import { createClient } from '@/lib/supabase/server'
import { OutfitVariantRaw } from '@/lib/types/outfit'
import { cache } from 'react'

const SELECT = `
  id,
  slug,
  outfit_set,
  outfit_category,
  seasons,
  season_category,
  rarity,
  style,
  label,
  label_2,
  title,
  description,
  image_url,
  alt_image_url,
  default,
  updated_at,
  outfit_sets ( title ),
  outfit_categories ( title ),
  seasons ( title ),
  season_categories ( title )
`

export const getOutfitVariantsRaw = cache(async () => {
  const supabase = await createClient()

  const { data: outfitVariants } = await supabase
    .from('outfit_variants')
    .select(SELECT)
    .order('id', { ascending: false })

  return (outfitVariants ?? []) as OutfitVariantRaw[]
})

export const getOutfitVariantRaw = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: outfitVariant } = await supabase
    .from('outfit_variants')
    .select(SELECT)
    .eq('slug', slug)
    .maybeSingle()

  return (outfitVariant ?? null) as OutfitVariantRaw | null
})
