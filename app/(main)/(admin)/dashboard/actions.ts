'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateTrial(
  id: number,
  fields: {
    title?: string
    realm?: string | null
    location?: string | null
    description?: string | null
  }
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trials')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateEurekaSet(
  id: number,
  fields: {
    title?: string
    description?: string | null
    rarity?: number | null
    style?: string | null
    label?: string | null
  }
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('eureka_sets')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateEurekaVariant(
  id: number,
  fields: {
    eureka_set?: string | null
    category?: string | null
    color?: string | null
    default?: boolean
  }
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('eureka_variants')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
