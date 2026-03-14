import { createClient } from '@/lib/supabase/server'
import { ObtainedEureka } from '@/lib/types/eureka'
import { UUID } from 'crypto'
import { cache } from 'react'

export const getObtainedEureka = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  const { data: obtainedEureka } = await supabase
    .from('obtained_eureka')
    .select(
      `
			id,
			eureka_set,
			category,
			color
		`
    )
    .eq('user_id', user_id)

  return obtainedEureka as ObtainedEureka[]
})
