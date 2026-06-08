import { cache } from 'react'
import { createClient } from '../../lib/supabase/server'
import { CustomLook } from '../../lib/types/looks'

export const getCustomLooks = cache(async (user_id: string): Promise<CustomLook[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('custom_looks')
    .select(
      'id, user_id, name, description, eureka_variant_slugs, outfit_variant_slugs, created_at, updated_at'
    )
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
  return data ?? []
})

export const getCustomLook = cache(
  async (id: string, user_id: string): Promise<CustomLook | null> => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('custom_looks')
      .select(
        'id, user_id, name, description, eureka_variant_slugs, outfit_variant_slugs, created_at, updated_at'
      )
      .eq('id', id)
      .eq('user_id', user_id)
      .single()
    return data ?? null
  }
)
