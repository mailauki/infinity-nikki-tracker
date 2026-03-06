import { createClient } from '@/lib/supabase/server'
import { Obtained } from '@/lib/types/eureka'
import { UUID } from 'crypto'
import { cache } from 'react'

export const getObtained = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  const { data: obtained } = await supabase
    .from('obtained')
    .select(
      `
			id,
			eureka_set,
			category,
			color
		`
    )
    .eq('user_id', user_id)

  return obtained as Obtained[]
})
