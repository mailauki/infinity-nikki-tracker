'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserID } from '@/hooks/user'

export async function handleObtainedOutfit(
  outfit_set: string,
  outfit_category: string,
  evolution: string | null
) {
  const user_id = await getUserID()
  if (!user_id) throw new Error('Not authenticated')

  const supabase = await createClient()

  const { error } = await supabase.rpc('toggle_obtained_outfit', {
    p_outfit_set: outfit_set,
    p_outfit_category: outfit_category,
    p_evolution: evolution as string,
  })

  if (error) {
    console.error('toggle_obtained_outfit failed:', error)
    throw new Error(error.message)
  }
}
