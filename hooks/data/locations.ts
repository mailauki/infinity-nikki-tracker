import { cache } from 'react'
import { Location } from '@/lib/types/outfit'
import { createClient } from '@/lib/supabase/server'

export const getLocations = cache(async () => {
  const supabase = await createClient()

  const { data: locations } = await supabase
    .from('locations')
    .select('slug, title')
    .order('title', { ascending: true })

  return (locations ?? []) as Location[]
})
