import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export const getEurekaVariantsRaw = cache(async () => {
  const supabase = await createClient()

  const { data: eurekaVariants } = await supabase
    .from('eureka_variants')
    .select('*, eureka_sets ( title ), eureka_categories ( title ), eureka_colors ( title )')
    .order('id', { ascending: false })

  return eurekaVariants ?? []
})
