'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserID } from '@/hooks/user'

export async function handleObtained(eureka_set: string, category: string, color: string) {
  const user_id = await getUserID()
  if (!user_id) throw new Error('Not authenticated')

  const supabase = await createClient()

  const { error } = await supabase.rpc('toggle_obtained', {
    p_eureka_set: eureka_set,
    p_category: category,
    p_color: color,
  })

  if (error) {
    console.error('toggle_obtained failed:', error)
    throw new Error(error.message)
  }
}
