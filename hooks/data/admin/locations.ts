import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types/supabase'

export type LocationRaw = Pick<
  Tables<'locations'>,
  'id' | 'slug' | 'title' | 'image_url' | 'updated_at'
>

export async function getLocationsRaw(): Promise<LocationRaw[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('locations')
    .select('id, slug, title, image_url, updated_at')
    .order('id', { ascending: true })

  return (data ?? []) as LocationRaw[]
}

export async function getLocationRaw(slug: string): Promise<LocationRaw | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('locations')
    .select('id, slug, title, image_url, updated_at')
    .eq('slug', slug)
    .maybeSingle()

  return data as LocationRaw | null
}
