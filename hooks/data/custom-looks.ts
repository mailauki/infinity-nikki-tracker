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

export const getCustomLooks = cache(async (user_id: string): Promise<CustomLook[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('custom_looks')
    .select(
      'id, user_id, name, description, eureka_variant_slugs, outfit_variant_slugs, created_at, updated_at'
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
        'id, user_id, name, description, eureka_variant_slugs, outfit_variant_slugs, created_at, updated_at'
      )
      .eq('id', id)
      .eq('user_id', user_id)
      .single()
    return data ?? null
  }
)
