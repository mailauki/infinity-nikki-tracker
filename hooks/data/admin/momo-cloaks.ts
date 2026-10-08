import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

const RAW_COLUMNS = '*'

export const getMomoCloaksRaw = cache(async () => {
  const supabase = await createClient()

  const { data: momoCloaks } = await supabase
    .from('momo_cloaks')
    .select(RAW_COLUMNS)
    .order('updated_at', { ascending: false, nullsFirst: false })

  return momoCloaks ?? []
})

export const getMomoCloakRaw = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: momoCloak } = await supabase
    .from('momo_cloaks')
    .select(RAW_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  return momoCloak
})
