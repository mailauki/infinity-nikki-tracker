import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types/supabase'

export type AbilityRaw = Pick<Tables<'abilities'>, 'id' | 'slug' | 'title' | 'image_url'>

export async function getAbilitiesRaw(): Promise<AbilityRaw[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('abilities')
    .select('id, slug, title, image_url')
    .order('title', { ascending: true })

  return (data ?? []) as AbilityRaw[]
}

export async function getAbilityRaw(slug: string): Promise<AbilityRaw | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('abilities')
    .select('id, slug, title, image_url')
    .eq('slug', slug)
    .maybeSingle()

  return data as AbilityRaw | null
}
