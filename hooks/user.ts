import { UUID } from 'crypto'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'

export const getUserID = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  const user = data?.claims.user_metadata

  if (!user) return null

  const user_id = user.sub as UUID | string

  return user_id
})
