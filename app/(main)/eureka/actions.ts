'use server'

import { createClient } from '@/lib/supabase/server'

export async function handleObtained(eureka_set: string, category: string, color: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('toggle_obtained', {
    p_eureka_set: eureka_set,
    p_category: category,
    p_color: color,
  })

  if (error) console.log(error)
}
