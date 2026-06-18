import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OutfitSet, ObtainedOutfit } from '@/lib/types/outfit'
import { createOutfitSet, updateOutfitSet } from '@/hooks/outfit'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getEvolutions } from '@/hooks/data/evolutions'
import { getObtainedOutfit } from '@/hooks/data/obtained-outfit'

export async function GET() {
  const supabase = await createClient()

  const { data: outfitSets, error } = await supabase
    .from('outfit_sets')
    .select(
      `id, slug, title, description, rarity, style, label, label_2, ability, image_url, alt_image_url, glowup_evolution, seasons, season_category, updated_at, outfit_variants ( id, slug, outfit_set, evolution, outfit_category, image_url, alt_image_url, default ), outfit_set_carousel_images ( id, image_url, sort_order )`
    )
    .order('id', { ascending: true })
    .order('id', { referencedTable: 'outfit_variants', ascending: true })

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
      } as unknown as Omit<OutfitSet, 'created_at' | 'outfit_categories' | 'evolutions'>,
      outfitCategories,
      evolutions,
    })
  ) as OutfitSet[]

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(outfits)
  }

  let obtainedOutfit: ObtainedOutfit[]
  try {
    // Reads every page (PostgREST caps a single response at 1000 rows). Base
    // variants carry the concrete {set}-base slug end-to-end, matching what
    // createOutfitSet leaves on base variants — so obtained rows match directly.
    obtainedOutfit = await getObtainedOutfit(user.id)
  } catch (obtainedError) {
    const message =
      obtainedError instanceof Error ? obtainedError.message : 'Failed to fetch obtained outfits'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const outfitsWithObtained = outfits.map((outfitSet) =>
    updateOutfitSet({ outfitSet, obtainedOutfit })
  )

  return NextResponse.json(outfitsWithObtained)
}
