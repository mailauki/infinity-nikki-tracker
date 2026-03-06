import { createClient } from '@/lib/supabase/server'
import { UUID } from 'crypto'
import { cache } from 'react'
import { getCategories } from './categories'
import { getColors } from './colors'
import { getEurekaSetsRaw } from './admin/eureka-sets'
import { getEurekaVariantsRaw } from './admin/eureka-variants'
import { getTrials } from './trials'

export const getAdminData = cache(async () => {
  const categories = await getCategories()
  const colors = await getColors()
  const eurekaSets = await getEurekaSetsRaw()
  const eurekaVariants = await getEurekaVariantsRaw()
  const trials = await getTrials()

  return { eurekaSets, categories, colors, eurekaVariants, trials }
})

export const getProfile = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  const {
    data: profile,
    error,
    status,
  } = await supabase
    .from('profiles')
    .select(`full_name, username, avatar_url`)
    .eq('id', user_id)
    .single()

  return { profile, error, status }
})
