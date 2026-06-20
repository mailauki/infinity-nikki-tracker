import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types/supabase'

export type SeasonRaw = Pick<
  Tables<'seasons'>,
  'id' | 'slug' | 'title' | 'location' | 'image_url' | 'alt_image_url' | 'description'
>

export async function getSeasonsRaw(): Promise<SeasonRaw[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('seasons')
    .select('id, slug, title, location, image_url, alt_image_url, description')
    .order('id', { ascending: true })

  return (data ?? []) as SeasonRaw[]
}

export async function getSeasonRaw(slug: string): Promise<SeasonRaw | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('seasons')
    .select('id, slug, title, location, image_url, alt_image_url, description')
    .eq('slug', slug)
    .maybeSingle()

  return data as SeasonRaw | null
}
