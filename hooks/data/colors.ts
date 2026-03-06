import { createClient } from '@/lib/supabase/server'
import { Color } from '@/lib/types/eureka'
import { cache } from 'react'

export const getColors = cache(async () => {
  const supabase = await createClient()

  const { data: colors } = await supabase.from('colors').select('title, image_url').order('id', { ascending: true })

  return colors as Color[]
})
