import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getUserID } from '../user'
import { getOutfitCategories } from './outfit-categories'
import { getEvolutions } from './evolutions'
import { getObtainedOutfit } from './obtained-outfit'
import { getOutfitVariantsBySet } from './outfit-variants'
import { createOutfitSet, updateOutfitSet } from '../outfit'

// `forUserId` scopes the obtained flags to a specific user instead of the
// viewer — see the note on getEurekaSets. Omit it to resolve the signed-in user.
export const getOutfitSets = cache(async (forUserId?: string) => {
  const supabase = await createClient()

  // Variants injected from the paginated grouped fetch — a PostgREST embed caps
  // at 1000 rows and would drop most of the ~6k variants.
  const [{ data: outfitSets }, variantsBySet] = await Promise.all([
    supabase
      .from('outfit_sets')
      .select(
        `
        id,
        slug,
        title,
        subtitle,
        description,
        rarity,
        style,
        label,
        label_2,
        ability,
        seasons,
        season_category,
        "order",
        base_set,
        handheld_base_only,
        season:seasons!outfit_sets_seasons_fkey ( title ),
        seasonCategory:season_categories!outfit_sets_season_category_fkey ( title ),
        image_url,
        alt_image_url,
        updated_at,
        outfit_set_carousel_images (
          id,
          image_url,
          sort_order
        )
      `
      )
      .is('base_set', null)
      .order('id', { ascending: true })
      .order('sort_order', { referencedTable: 'outfit_set_carousel_images', ascending: true }),
    getOutfitVariantsBySet(),
  ])

  const outfitCategories = await getOutfitCategories()
  const evolutions = await getEvolutions()

  const outfits = (outfitSets ?? []).map((outfitSet) =>
    createOutfitSet({
      outfitSet: {
        ...outfitSet,
        outfit_variants: variantsBySet.get(outfitSet.slug) ?? [],
        carousel_images: outfitSet.outfit_set_carousel_images ?? [],
      },
      outfitCategories,
      evolutions,
    })
  )

  const user_id = forUserId ?? (await getUserID())
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
      subtitle,
      description,
      rarity,
      style,
      label,
      label_2,
      ability,
      seasons,
      season_category,
      "order",
      base_set,
      handheld_base_only,
      season:seasons!outfit_sets_seasons_fkey ( title ),
      seasonCategory:season_categories!outfit_sets_season_category_fkey ( title ),
      image_url,
      alt_image_url,
      updated_at,
      outfit_variants (
        id,
        slug,
        outfit_set,
        outfit_category,
        title,
        image_url,
        alt_image_url,
        default,
        rarity,
        seasons,
        season_category
      ),
      outfit_set_carousel_images (
        id,
        image_url,
        sort_order
      ),
      momoCloak:momo_cloaks!momo_cloaks_outfit_set_fkey ( slug, title, image_url ),
      makeupSet:makeup_sets!makeup_sets_outfit_set_fkey ( slug, title, image_url )
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

  // momo_cloaks/makeup_sets point AT outfit_sets, so these embeds come back as
  // arrays even though no outfit has more than one of either today — nothing at
  // the DB level enforces that. Collapse to the first row (or null) so consumers
  // get a single linked set rather than having to index into an array.
  const first = <T>(rows: T[] | T | null | undefined): T | null =>
    Array.isArray(rows) ? (rows[0] ?? null) : (rows ?? null)

  const outfit = createOutfitSet({
    outfitSet: {
      ...outfitSet,
      carousel_images: outfitSet.outfit_set_carousel_images ?? [],
      momoCloak: first(outfitSet.momoCloak),
      makeupSet: first(outfitSet.makeupSet),
    },
    outfitCategories,
    evolutions,
  })

  const user_id = await getUserID()
  if (!user_id) return outfit

  const obtainedOutfit = await getObtainedOutfit(user_id)

  return updateOutfitSet({ outfitSet: outfit, obtainedOutfit })
})
