import { cache } from 'react'
import { Evolution } from '@/lib/types/outfit'
import { createClient } from '@/lib/supabase/server'

export const getEvolutions = cache(async () => {
  const supabase = await createClient()

  const { data: evolutions } = await supabase
    .from('evolutions')
    .select('slug, title, subtitle, description, order')
    .order('order', { ascending: true })

  return (evolutions ?? []) as Evolution[]
})
