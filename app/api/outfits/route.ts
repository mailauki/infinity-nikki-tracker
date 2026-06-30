import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ObtainedOutfit, OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { createOutfitSet, updateOutfitSet } from '@/hooks/outfit'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getEvolutions } from '@/hooks/data/evolutions'
import { getObtainedOutfit } from '@/hooks/data/obtained-outfit'

const VARIANT_SELECT = 'id, slug, outfit_set, outfit_category, title, image_url, alt_image_url, default'

export async function GET() {
  const supabase = await createClient()

  const [{ data: outfitSets, error }, { data: standaloneRaw }] = await Promise.all([
    supabase
      .from('outfit_sets')
      .select(
        `
        id, slug, title, description, rarity, style, label, label_2, ability,
        image_url, alt_image_url, "order", base_set, handheld_base_only, seasons, season_category, updated_at,
        season:seasons!outfit_sets_seasons_fkey ( title ),
        seasonCategory:season_categories!outfit_sets_season_category_fkey ( title ),
        outfit_variants ( ${VARIANT_SELECT} ),
        outfit_set_carousel_images ( id, image_url, sort_order )
        `
      )
      .is('base_set', null)
      .order('id', { ascending: true })
      .order('id', { referencedTable: 'outfit_variants', ascending: true })
      .order('sort_order', { referencedTable: 'outfit_set_carousel_images', ascending: true }),
    supabase
      .from('outfit_variants')
      .select(VARIANT_SELECT)
      .is('outfit_set', null)
      .order('id', { ascending: true }),
  ])

  if (error) {
    console.error('Failed to fetch outfit sets:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const [outfitCategories, evolutions] = await Promise.all([getOutfitCategories(), getEvolutions()])

  const outfits = (outfitSets ?? []).map((outfitSet) =>
    createOutfitSet({
      outfitSet: {
        ...outfitSet,
        carousel_images: outfitSet.outfit_set_carousel_images ?? [],
      },
      outfitCategories,
      evolutions,
    })
  ) as OutfitSet[]

  const standaloneVariants = (standaloneRaw ?? []) as OutfitVariant[]

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ outfitSets: outfits, standaloneVariants })
  }

  let obtainedOutfit: ObtainedOutfit[]
  try {
    obtainedOutfit = await getObtainedOutfit(user.id)
  } catch (obtainedError) {
    const message =
      obtainedError instanceof Error ? obtainedError.message : 'Failed to fetch obtained outfits'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const outfitsWithObtained = outfits.map((outfitSet) =>
    updateOutfitSet({ outfitSet, obtainedOutfit })
  )

  return NextResponse.json({ outfitSets: outfitsWithObtained, standaloneVariants })
}
