import { cache } from 'react'
import { Evolution } from '@/lib/types/outfit'
import { createClient } from '@/lib/supabase/server'

const EVOLUTION_SELECT = `
  id, slug, title, subtitle, description, order, outfit_set, image_url, alt_image_url,
  evolution_carousel_images ( id, image_url, sort_order )
`

export const getEvolutions = cache(async () => {
  const supabase = await createClient()

  const { data: evolutions } = await supabase
    .from('evolutions')
    .select(EVOLUTION_SELECT)
    .order('id', { ascending: true })
    .order('sort_order', { referencedTable: 'evolution_carousel_images', ascending: true })

  return (evolutions ?? []).map((e) => ({
    ...e,
    carousel_images: e.evolution_carousel_images ?? [],
  })) as Evolution[]
})

// Admin-only: embeds each evolution's variants for the evolutions admin table's
// per-category image uploaders. Kept separate from getEvolutions so the public
// data pipeline (createOutfitSet, outfits API) is not weighed down with variants.
export const getEvolutionsWithVariants = cache(async () => {
  const supabase = await createClient()

  const { data: evolutions } = await supabase
    .from('evolutions')
    .select(
      `
      ${EVOLUTION_SELECT},
      outfit_variants ( id, slug, outfit_set, evolution, outfit_category, title, image_url, alt_image_url, default )
    `
    )
    .order('id', { ascending: true })
    .order('sort_order', { referencedTable: 'evolution_carousel_images', ascending: true })

  return (evolutions ?? []).map((e) => ({
    ...e,
    carousel_images: e.evolution_carousel_images ?? [],
    outfit_variants: e.outfit_variants ?? [],
  })) as Evolution[]
})

export const getEvolutionsBySet = cache(async (outfitSetSlug: string) => {
  const supabase = await createClient()

  const { data: evolutions } = await supabase
    .from('evolutions')
    .select(EVOLUTION_SELECT)
    .eq('outfit_set', outfitSetSlug)
    .order('id', { ascending: true })
    .order('sort_order', { referencedTable: 'evolution_carousel_images', ascending: true })

  return (evolutions ?? []).map((e) => ({
    ...e,
    carousel_images: e.evolution_carousel_images ?? [],
  })) as Evolution[]
})
