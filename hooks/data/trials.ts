import { cacheLife } from 'next/cache'

import { createPublicClient } from '@/lib/supabase/public'
import { Trial } from '@/lib/types/eureka'

export async function getTrials() {
  'use cache'
  cacheLife('hours')

  const supabase = createPublicClient()

  const { data: trials } = await supabase
    .from('trials')
    .select('id, slug, title, image_url, updated_at')
    .order('id', { ascending: true })

  return trials as Trial[]
}

export async function getTrial(slug: string) {
  'use cache'
  cacheLife('hours')

  const supabase = createPublicClient()

  const { data: trial } = await supabase
    .from('trials')
    .select('id, slug, title, image_url, updated_at')
    .eq('slug', slug)
    .maybeSingle()

  return trial as Trial
}
