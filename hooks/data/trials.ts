import { createClient } from '@/lib/supabase/server'
import { Trial } from '@/lib/types/eureka'

export async function getTrials() {
  const supabase = await createClient()

  const { data: trials } = await supabase
    .from('trials')
    .select('id, slug, title, image_url, updated_at')
    .order('id', { ascending: true })

  return trials as Trial[]
}

export async function getTrial(slug: string) {
  const supabase = await createClient()

  const { data: trial } = await supabase
    .from('trials')
    .select('id, slug, title, image_url, updated_at')
    .eq('slug', slug)
    .maybeSingle()

  return trial as Trial
}
