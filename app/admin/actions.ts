'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/hooks/user'

async function requireAdmin() {
  const role = await getUserRole()
  if (role !== 'admin') throw new Error('Forbidden')
}

export async function updateTrial(
  id: number,
  fields: {
    title?: string
    realm?: string | null
    location?: string | null
    description?: string | null
  }
) {
  await requireAdmin()
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
  await requireAdmin()
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
  await requireAdmin()
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

export async function updateOutfitSet(
  id: number,
  fields: {
    title?: string
    description?: string | null
    rarity?: number
    style?: string | null
    label?: string | null
    label_2?: string | null
    ability?: string | null
    seasons?: string | null
    season_category?: string | null
  }
) {
  await requireAdmin()
  const supabase = await createClient()

  // FK columns reject '' — the grid's singleSelect '—' option yields an empty
  // string, so coerce those to null before writing.
  const FK_FIELDS = ['style', 'label', 'label_2', 'ability', 'seasons', 'season_category'] as const
  const normalized = { ...fields }
  for (const key of FK_FIELDS) {
    if (normalized[key] === '') normalized[key] = null
  }

  const { data, error } = await supabase
    .from('outfit_sets')
    .update({ ...normalized, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
