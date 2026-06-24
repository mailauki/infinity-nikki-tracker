import { cache } from 'react'
import { Evolution } from '@/lib/types/outfit'
import { createClient } from '@/lib/supabase/server'

// Columns shared by all evolution queries (outfit_sets rows with base_set IS NOT NULL).
// "order" is a reserved word in Postgres — always quoted in select strings.
const EVOLUTION_SELECT = `
  id, slug, title, "order", base_set, handheld_base_only, description, image_url, alt_image_url,
  style, label, label_2, ability, seasons, season_category, rarity, created_at, updated_at,
  season:seasons!outfit_sets_seasons_fkey ( title ),
  seasonCategory:season_categories!outfit_sets_season_category_fkey ( title ),
  outfit_set_carousel_images ( id, image_url, sort_order )
`

export const getEvolutions = cache(async () => {
  const supabase = await createClient()

  const { data: evolutions } = await supabase
    .from('outfit_sets')
    .select(
      `
      ${EVOLUTION_SELECT},
      outfit_variants (
        id, slug, outfit_set, outfit_category, title, image_url, alt_image_url, default
      )
    `
    )
    .not('base_set', 'is', null)
    .order('order', { ascending: true })

  return (evolutions ?? []).map((e) => ({
    ...e,
    outfit_variants: e.outfit_variants ?? [],
    outfit_categories: [],
    evolutions: [],
    carousel_images: e.outfit_set_carousel_images ?? [],
  })) as unknown as Evolution[]
})

// Admin-only: embeds each evolution's variants for the evolutions admin table's
// per-category image uploaders. Kept separate from getEvolutions so the public
// data pipeline (createOutfitSet, outfits API) is not weighed down with variants.
export const getEvolutionsWithVariants = cache(async () => {
  const supabase = await createClient()

  const { data: evolutions } = await supabase
    .from('outfit_sets')
    .select(
      `
      ${EVOLUTION_SELECT},
      outfit_variants ( id, slug, outfit_set, outfit_category, title, image_url, alt_image_url, default )
    `
    )
    .not('base_set', 'is', null)
    .order('order', { ascending: true })
    .order('sort_order', { referencedTable: 'outfit_set_carousel_images', ascending: true })

  return (evolutions ?? []).map((e) => ({
    ...e,
    outfit_categories: [],
    evolutions: [],
    carousel_images: e.outfit_set_carousel_images ?? [],
    outfit_variants: e.outfit_variants ?? [],
  })) as unknown as Evolution[]
})

export const getEvolutionsBySet = cache(async (outfitSetSlug: string) => {
  const supabase = await createClient()

  const { data: evolutions } = await supabase
    .from('outfit_sets')
    .select(EVOLUTION_SELECT)
    .eq('base_set', outfitSetSlug)
    .order('order', { ascending: true })
    .order('sort_order', { referencedTable: 'outfit_set_carousel_images', ascending: true })

  return (evolutions ?? []).map((e) => ({
    ...e,
    outfit_variants: [],
    outfit_categories: [],
    evolutions: [],
    carousel_images: e.outfit_set_carousel_images ?? [],
  })) as unknown as Evolution[]
})
