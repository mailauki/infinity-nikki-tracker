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
  season_categories ( title )
`

export const getOutfitVariantsRaw = cache(async () => {
  const supabase = await createClient()

  // Paginate — PostgREST caps at 1000 rows and there are ~6k variants, so a
  // single select would silently drop most of them from the admin table.
  const all: OutfitVariantRaw[] = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('outfit_variants')
      .select(SELECT)
      .order('id', { ascending: false })
      .range(from, from + PAGE - 1)
    if (error) throw error
    all.push(...((data ?? []) as OutfitVariantRaw[]))
    if (!data || data.length < PAGE) break
  }

  return all
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

// Base-set variant title for a given category — used to pre-fill a glow-up
// variant's title in the admin edit form.
export const getBaseVariantTitle = cache(
  async (baseSetSlug: string, outfitCategory: string): Promise<string | null> => {
    const supabase = await createClient()

    const { data } = await supabase
      .from('outfit_variants')
      .select('title')
      .eq('outfit_set', baseSetSlug)
      .eq('outfit_category', outfitCategory)
      .maybeSingle()

    const title = data?.title?.trim()
    return title ? title : null
  }
)
