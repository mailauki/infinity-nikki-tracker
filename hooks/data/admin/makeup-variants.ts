import { createClient } from '@/lib/supabase/server'
import { MakeupVariantRaw } from '@/lib/types/makeup'
import { cache } from 'react'

const RAW_COLUMNS = `
	*,
	makeup_sets ( title ),
	makeup_categories ( title )
`

export const getMakeupVariantsRaw = cache(async () => {
  const supabase = await createClient()

  const { data: makeupVariants } = await supabase
    .from('makeup_variants')
    .select(RAW_COLUMNS)
    .order('updated_at', { ascending: false, nullsFirst: false })

  return (makeupVariants ?? []) as MakeupVariantRaw[]
})

export const getMakeupVariantRaw = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: makeupVariant } = await supabase
    .from('makeup_variants')
    .select(RAW_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  return makeupVariant as MakeupVariantRaw | null
})
