import { cacheLife } from 'next/cache'

import { publicClient } from '@/lib/supabase/public'
import { Trial } from '@/lib/types/eureka'

export async function getTrials() {
  'use cache'
  cacheLife('hours')

  const { data: trials } = await publicClient
    .from('trials')
    .select('id, slug, title, image_url, updated_at')
    .order('id', { ascending: true })

  return trials as Trial[]
}

export async function getTrial(slug: string) {
  'use cache'
  cacheLife('hours')

  const { data: trial } = await publicClient
    .from('trials')
    .select('id, slug, title, image_url, updated_at')
    .eq('slug', slug)
    .maybeSingle()

  return trial as Trial
}
