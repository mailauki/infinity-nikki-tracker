import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { getUserID } from '../user'
import { getOutfitCategories } from './outfit-categories'
import { getEvolutions } from './evolutions'
import { getObtainedOutfit } from './obtained-outfit'
import { createOutfitSet, sortOutfitVariants, updateOutfitSet } from '../outfit'

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
      image_url,
      updated_at,
      outfit_variants (
        id,
        slug,
        outfit_set,
        evolution,
        outfit_category,
        image_url,
        default
      )
    `
    )
    .order('id', { ascending: true })
    .order('id', { referencedTable: 'outfit_variants', ascending: true })

  const outfitCategories = await getOutfitCategories()
  const evolutions = await getEvolutions()
  const categoryOrder = outfitCategories.map((c) => c.slug)

  const outfits = (outfitSets ?? []).map((outfitSet) => {
    const defaultEvolutionSlug = outfitSet.outfit_variants.find((v) => v.default)?.evolution
    const evolutionSlugs = [...new Set(outfitSet.outfit_variants.map((v) => v.evolution))]
    const resolvedEvolutions = evolutionSlugs
      .flatMap((slug) => evolutions.filter((e) => e.slug === slug))
      .sort((a, b) => a.order - b.order)

    return {
      ...outfitSet,
      image_url:
        outfitSet.image_url ??
        (
          outfitSet.outfit_variants.find((v) => v.default && v.outfit_category === 'hair') ??
          outfitSet.outfit_variants.find((v) => v.default)
        )?.image_url,
      outfit_categories: outfitCategories,
      evolutions: resolvedEvolutions,
      outfit_variants: sortOutfitVariants(
        outfitSet.outfit_variants as OutfitVariant[],
        defaultEvolutionSlug,
        categoryOrder
      ),
    }
  }) as OutfitSet[]

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
      image_url,
      updated_at,
      outfit_variants (
        id,
        slug,
        outfit_set,
        evolution,
        outfit_category,
        image_url,
        default
      )
    `
    )
    .order('id', { ascending: true })
    .order('id', { referencedTable: 'outfit_variants', ascending: false })
    .eq('slug', slug)
    .single()

  if (!outfitSet) notFound()

  const outfitCategories = await getOutfitCategories()
  const evolutions = await getEvolutions()

  const outfit = createOutfitSet({ outfitSet, outfitCategories, evolutions })

  const user_id = await getUserID()
  if (!user_id) return outfit

  const obtainedOutfit = await getObtainedOutfit(user_id)

  return updateOutfitSet({ outfitSet: outfit, obtainedOutfit })
})
