'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserID } from '@/hooks/user'

export async function handleObtainedMomoCloak(momo_cloak: string) {
  const user_id = await getUserID()
  if (!user_id) throw new Error('Not authenticated')

  const supabase = await createClient()

  const { error } = await supabase.rpc('toggle_obtained_momo_cloak', {
    p_momo_cloak: momo_cloak,
  })

  if (error) {
    console.error('toggle_obtained_momo_cloak failed:', error)
    throw new Error(error.message)
  }
}
