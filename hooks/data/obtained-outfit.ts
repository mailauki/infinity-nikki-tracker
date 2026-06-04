import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ObtainedOutfit } from '@/lib/types/outfit'
import { UUID } from 'crypto'

export const getObtainedOutfit = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  const { data: obtainedOutfit } = await supabase
    .from('obtained_outfit')
    .select('id, outfit_set, outfit_category, evolution')
    .eq('user_id', user_id)

  return (obtainedOutfit ?? []) as ObtainedOutfit[]
})
