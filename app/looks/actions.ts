'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserID } from '@/hooks/user'
import { getCustomLooks } from '@/hooks/data/custom-looks'
import { FREE_LOOKS_LIMIT } from '@/lib/types/looks'

export async function createLook(data: {
  name: string
  description: string | null
  eureka_variant_slugs: string[]
  outfit_variant_slugs: string[]
}) {
  const user_id = await getUserID()
  if (!user_id) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', user_id)
    .single()

  const existing = await getCustomLooks(user_id)
  if (!profile?.is_premium && existing.length >= FREE_LOOKS_LIMIT) {
    return { error: 'free_limit_reached' }
  }

  const { data: look, error } = await supabase
    .from('custom_looks')
    .insert({ user_id, ...data })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/looks')
  return { id: look.id }
}

export async function updateLook(
  id: string,
  data: {
    name: string
    description: string | null
    eureka_variant_slugs: string[]
    outfit_variant_slugs: string[]
  }
) {
  const user_id = await getUserID()
  if (!user_id) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('custom_looks')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user_id)

  if (error) return { error: error.message }

  revalidatePath('/looks')
  revalidatePath(`/looks/${id}`)
  return {}
}

export async function deleteLook(id: string) {
  const user_id = await getUserID()
  if (!user_id) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const { error } = await supabase.from('custom_looks').delete().eq('id', id).eq('user_id', user_id)

  if (error) return { error: error.message }

  revalidatePath('/looks')
  return {}
}
