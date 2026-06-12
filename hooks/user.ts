import { UUID } from 'crypto'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'

export const getUserClaims = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  const user = data?.claims

  if (!user) return null

  return user
})

export const getUserID = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  const user_id = data?.claims?.sub as UUID | string | undefined

  return user_id ?? null
})

export const getUserRole = cache(async () => {
  const supabase = await createClient()
  const user_id = await getUserID()
  if (!user_id) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user_id).single()
  return data?.role as 'user' | 'admin' | null
})
