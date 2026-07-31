import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { OutfitVariant } from '@/lib/types/outfit'

// Columns the public pipeline needs for each variant (mirrors the old embed).
const PUBLIC_VARIANT_SELECT =
  'id, slug, outfit_set, outfit_category, title, image_url, alt_image_url, default, rarity'

// PostgREST returns at most 1000 rows per request (and caps embedded rows the
// same way), so fetching outfit_variants via a join on outfit_sets silently
// dropped most of the ~6k variants. Fetch them directly with pagination instead.
//
// Fetching the exact count first lets every page go out at once: the old
// sequential loop cost ~7 round-trips in series, and each OFFSET made Postgres
// scan and discard the rows before it (measured: one unpaginated query is 4.9ms,
// while LIMIT 1000 OFFSET 6000 alone is 323ms).
async function fetchAllOutfitVariants(): Promise<OutfitVariant[]> {
  const supabase = await createClient()
  const PAGE = 1000

  const { count, error: countError } = await supabase
    .from('outfit_variants')
    .select('id', { count: 'exact', head: true })
  if (countError) throw countError

  const total = count ?? 0
  if (total <= 0) return []

  const pages = Array.from({ length: Math.ceil(total / PAGE) }, (_, i) => i * PAGE)
  const results = await Promise.all(
    pages.map(async (from) => {
      // `.order('id')` must stay on EVERY page: without it PostgREST's row order
      // is unspecified and the concatenated result silently scrambles, which
      // breaks createOutfitSet's category sorting downstream.
      const { data, error } = await supabase
        .from('outfit_variants')
        .select(PUBLIC_VARIANT_SELECT)
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) throw error
      return (data ?? []) as OutfitVariant[]
    })
  )

  // Pages come back in range order, so the flattened array is still sorted by id
  // exactly as the sequential loop produced.
  return results.flat()
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
