import { cache } from 'react'
import { Ability } from '@/lib/types/outfit'
import { createClient } from '@/lib/supabase/server'

export const getAbilities = cache(async () => {
  const supabase = await createClient()

  const { data: abilities } = await supabase
    .from('abilities')
    .select('slug, title, image_url')
    .order('title', { ascending: true })

  return (abilities ?? []) as Ability[]
})
