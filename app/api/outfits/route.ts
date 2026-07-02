import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ObtainedOutfit, OutfitSet } from '@/lib/types/outfit'
import { createOutfitSet, updateOutfitSet } from '@/hooks/outfit'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getEvolutions } from '@/hooks/data/evolutions'
import { getObtainedOutfit } from '@/hooks/data/obtained-outfit'
import { getOutfitVariantsBySet } from '@/hooks/data/outfit-variants'

export async function GET() {
  const supabase = await createClient()

  // Variants are fetched separately (paginated) and injected — a PostgREST embed
  // caps at 1000 rows and there are ~6k variants. See getOutfitVariantsBySet.
  const [{ data: outfitSets, error }, variantsBySet] = await Promise.all([
    supabase
      .from('outfit_sets')
      .select(
        `
        id, slug, title, description, rarity, style, label, label_2, ability,
        image_url, alt_image_url, "order", base_set, handheld_base_only, seasons, season_category, updated_at,
        season:seasons!outfit_sets_seasons_fkey ( title ),
        seasonCategory:season_categories!outfit_sets_season_category_fkey ( title ),
        outfit_set_carousel_images ( id, image_url, sort_order )
        `
      )
      .is('base_set', null)
      .order('id', { ascending: true })
      .order('sort_order', { referencedTable: 'outfit_set_carousel_images', ascending: true }),
    getOutfitVariantsBySet(),
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
        outfit_variants: variantsBySet.get(outfitSet.slug) ?? [],
        carousel_images: outfitSet.outfit_set_carousel_images ?? [],
      },
      outfitCategories,
      evolutions,
    })
  ) as OutfitSet[]

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ outfitSets: outfits })
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

  return NextResponse.json({ outfitSets: outfitsWithObtained })
}
