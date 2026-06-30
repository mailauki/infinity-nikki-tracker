import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types/supabase'

export type SeasonCategoryRaw = Pick<
  Tables<'season_categories'>,
  'id' | 'slug' | 'title' | 'image_url' | 'description'
>

export async function getSeasonCategoriesRaw(): Promise<SeasonCategoryRaw[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('season_categories')
    .select('id, slug, title, image_url, description')
    .order('id', { ascending: true })

  return (data ?? []) as SeasonCategoryRaw[]
}

export async function getSeasonCategoryRaw(slug: string): Promise<SeasonCategoryRaw | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('season_categories')
    .select('id, slug, title, image_url, description')
    .eq('slug', slug)
    .maybeSingle()

  return data as SeasonCategoryRaw | null
}
