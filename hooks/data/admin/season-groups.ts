import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types/supabase'

export type SeasonGroupRaw = Pick<
  Tables<'season_groups'>,
  'id' | 'slug' | 'title' | 'image_url' | 'description'
>

export async function getSeasonGroupsRaw(): Promise<SeasonGroupRaw[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('season_groups')
    .select('id, slug, title, image_url, description')
    .order('id', { ascending: true })

  return (data ?? []) as SeasonGroupRaw[]
}

export async function getSeasonGroupRaw(slug: string): Promise<SeasonGroupRaw | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('season_groups')
    .select('id, slug, title, image_url, description')
    .eq('slug', slug)
    .maybeSingle()

  return data as SeasonGroupRaw | null
}
