import { UUID } from 'crypto'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'

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
  const { data: isAdmin } = await supabase.rpc('is_admin')
  return isAdmin ? 'admin' : 'user'
})
