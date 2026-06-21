import { cache } from 'react'
import { createClient } from '../../lib/supabase/server'
import { CustomLook } from '../../lib/types/looks'

export const getLookThumbnails = cache(
  async (looks: CustomLook[]): Promise<Map<string, string | null>> => {
    const supabase = await createClient()
    const eurekaSlugs = [...new Set(looks.flatMap((l) => l.eureka_variant_slugs.slice(0, 4)))]
    const outfitSlugs = [...new Set(looks.flatMap((l) => l.outfit_variant_slugs.slice(0, 4)))]

    const [{ data: eurekaThumbs }, { data: outfitThumbs }] = await Promise.all([
      eurekaSlugs.length > 0
        ? supabase.from('eureka_variants').select('slug, image_url').in('slug', eurekaSlugs)
        : Promise.resolve({ data: [] }),
      outfitSlugs.length > 0
        ? supabase.from('outfit_variants').select('slug, image_url').in('slug', outfitSlugs)
        : Promise.resolve({ data: [] }),
    ])

    return new Map<string, string | null>([
      ...(eurekaThumbs ?? []).map((v): [string, string | null] => [v.slug, v.image_url]),
      ...(outfitThumbs ?? []).map((v): [string, string | null] => [v.slug, v.image_url]),
    ])
  }
)

// Maps each outfit variant slug used across the given looks to its category
// `part` ("Pieces" | "Accessories"), so look cards can split the outfit count.
export const getOutfitSlugParts = cache(
  async (looks: CustomLook[]): Promise<Map<string, string>> => {
    const supabase = await createClient()
    const outfitSlugs = [...new Set(looks.flatMap((l) => l.outfit_variant_slugs))]
    if (outfitSlugs.length === 0) return new Map()

    const { data } = await supabase
      .from('outfit_variants')
      .select('slug, outfit_categories ( part )')
      .in('slug', outfitSlugs)

    return new Map(
      (data ?? [])
        .map((v): [string, string] | null => {
          const part = (v.outfit_categories as { part: string } | null)?.part
          return part ? [v.slug, part] : null
        })
        .filter((entry): entry is [string, string] => entry !== null)
    )
  }
)

export const getCustomLooks = cache(async (user_id: string): Promise<CustomLook[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('custom_looks')
    .select(
      'id, user_id, name, description, image_url, slug, eureka_variant_slugs, outfit_variant_slugs, created_at, updated_at'
    )
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
  return data ?? []
})

export const getCustomLook = cache(
  async (id: string, user_id: string): Promise<CustomLook | null> => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('custom_looks')
      .select(
        'id, user_id, name, description, image_url, slug, eureka_variant_slugs, outfit_variant_slugs, created_at, updated_at'
      )
      .eq('id', id)
      .eq('user_id', user_id)
      .single()
    return data ?? null
  }
)
