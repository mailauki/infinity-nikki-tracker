'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserID } from '@/hooks/user'

export async function handleObtainedMakeup(
  makeup_set: string,
  makeup_category: string,
  makeup_variant: string
) {
  const user_id = await getUserID()
  if (!user_id) throw new Error('Not authenticated')

  const supabase = await createClient()

  const { error } = await supabase.rpc('toggle_obtained_makeup', {
    p_makeup_set: makeup_set,
    p_makeup_category: makeup_category,
    p_makeup_variant: makeup_variant,
  })

  if (error) {
    console.error('toggle_obtained_makeup failed:', error)
    throw new Error(error.message)
  }
}
