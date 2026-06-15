import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getUserID } from '../user'
import { getOutfitCategories } from './outfit-categories'
import { getEvolutions } from './evolutions'
import { getObtainedOutfit } from './obtained-outfit'
import { createOutfitSet, updateOutfitSet } from '../outfit'

export const getOutfitSets = cache(async () => {
  const supabase = await createClient()

  const { data: outfitSets } = await supabase
    .from('outfit_sets')
    .select(
      `
      id,
      slug,
      title,
      description,
      rarity,
      style,
      label,
      label_2,
      ability,
      seasons,
      location,
      image_url,
      alt_image_url,
      glowup_evolution,
      updated_at,
      outfit_variants (
        id,
        slug,
        outfit_set,
        evolution,
        outfit_category,
        image_url,
        alt_image_url,
        default
      ),
      outfit_set_carousel_images (
        id,
        image_url,
        sort_order
      )
    `
    )
    .order('id', { ascending: true })
    .order('id', { referencedTable: 'outfit_variants', ascending: true })
    .order('sort_order', { referencedTable: 'outfit_set_carousel_images', ascending: true })

  const outfitCategories = await getOutfitCategories()
  const evolutions = await getEvolutions()

  const outfits = (outfitSets ?? []).map((outfitSet) =>
    createOutfitSet({
      outfitSet: {
        ...outfitSet,
        carousel_images: outfitSet.outfit_set_carousel_images ?? [],
      },
      outfitCategories,
      evolutions,
    })
  )

  const user_id = await getUserID()
  if (!user_id) return outfits

  const obtainedOutfit = await getObtainedOutfit(user_id)

  return outfits.map((outfitSet) => updateOutfitSet({ outfitSet, obtainedOutfit }))
})

export const getOutfitSet = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: outfitSet } = await supabase
    .from('outfit_sets')
    .select(
      `
      id,
      slug,
      title,
      description,
      rarity,
      style,
      label,
      label_2,
      ability,
      seasons,
      location,
      image_url,
      alt_image_url,
      glowup_evolution,
      updated_at,
      outfit_variants (
        id,
        slug,
        outfit_set,
        evolution,
        outfit_category,
        image_url,
        alt_image_url,
        default
      ),
      outfit_set_carousel_images (
        id,
        image_url,
        sort_order
      )
    `
    )
    .order('id', { ascending: true })
    .order('id', { referencedTable: 'outfit_variants', ascending: false })
    .order('sort_order', { referencedTable: 'outfit_set_carousel_images', ascending: true })
    .eq('slug', slug)
    .single()

  if (!outfitSet) notFound()

  const outfitCategories = await getOutfitCategories()
  const evolutions = await getEvolutions()

  const outfit = createOutfitSet({
    outfitSet: {
      ...outfitSet,
      carousel_images: outfitSet.outfit_set_carousel_images ?? [],
    },
    outfitCategories,
    evolutions,
  })

  const user_id = await getUserID()
  if (!user_id) return outfit

  const obtainedOutfit = await getObtainedOutfit(user_id)

  return updateOutfitSet({ outfitSet: outfit, obtainedOutfit })
})
