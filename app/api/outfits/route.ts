import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OutfitSet, OutfitVariant, ObtainedOutfit } from '@/lib/types/outfit'
import { createOutfitSet } from '@/hooks/outfit'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getEvolutions } from '@/hooks/data/evolutions'

export async function GET() {
  const supabase = await createClient()

  const { data: outfitSets, error } = await supabase
    .from('outfit_sets')
    .select(
      `id, slug, title, description, rarity, style, label, label_2, ability,
       image_url, alt_image_url, glowup_evolution, updated_at,
       outfit_variants ( id, slug, outfit_set, evolution, outfit_category, image_url, alt_image_url, default )`
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
      outfitSet: outfitSet as Omit<OutfitSet, 'created_at' | 'outfit_categories' | 'evolutions'>,
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

  const { data: obtained, error: obtainedError } = await supabase
    .from('obtained_outfit')
    .select('id, outfit_set, outfit_category, evolution')
    .eq('user_id', user.id)

  if (obtainedError) {
    console.error('Failed to fetch obtained outfits:', obtainedError)
    return NextResponse.json({ error: obtainedError.message }, { status: 500 })
  }

  const obtainedOutfit = (obtained ?? []) as ObtainedOutfit[]

  const outfitsWithObtained = outfits.map((outfitSet) => ({
    ...outfitSet,
    outfit_variants: outfitSet.outfit_variants.map((variant) => ({
      ...variant,
      obtained: !!obtainedOutfit.find(
        (o) =>
          variant.outfit_set === o.outfit_set &&
          variant.outfit_category === o.outfit_category &&
          (variant.evolution === null ? o.evolution === null : variant.evolution === o.evolution)
      ),
    })) as OutfitVariant[],
  })) as OutfitSet[]

  return NextResponse.json(outfitsWithObtained)
}
