import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { OutfitVariant } from '@/lib/types/outfit'

// Columns the public pipeline needs for each variant (mirrors the old embed).
const PUBLIC_VARIANT_SELECT =
  'id, slug, outfit_set, outfit_category, title, image_url, alt_image_url, default, rarity'

// PostgREST returns at most 1000 rows per request (and caps embedded rows the
// same way), so fetching outfit_variants via a join on outfit_sets silently
// dropped most of the ~6k variants. Fetch them directly with pagination instead.
async function fetchAllOutfitVariants(): Promise<OutfitVariant[]> {
  const supabase = await createClient()
  const all: OutfitVariant[] = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('outfit_variants')
      .select(PUBLIC_VARIANT_SELECT)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw error
    all.push(...((data ?? []) as OutfitVariant[]))
    if (!data || data.length < PAGE) break
  }
  return all
}

/**
 * All outfit variants grouped by their `outfit_set` slug (base, evolution, or
 * `standalone-pieces` for the standalone bag). Use this to inject variants into
 * sets/evolutions instead of the capped embed. The `?? ''` fallback is vestigial:
 * a NULL `outfit_set` no longer occurs (migrated to `standalone-pieces`).
 */
export const getOutfitVariantsBySet = cache(async (): Promise<Map<string, OutfitVariant[]>> => {
  const variants = await fetchAllOutfitVariants()
  const map = new Map<string, OutfitVariant[]>()
  for (const v of variants) {
    const key = v.outfit_set ?? ''
    const bucket = map.get(key)
    if (bucket) bucket.push(v)
    else map.set(key, [v])
  }
  return map
})
