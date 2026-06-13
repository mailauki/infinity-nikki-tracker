import { cache } from 'react'

import { createClient } from '../../lib/supabase/server'
import { AdminPreferences, UserPreferences } from '../../lib/types/eureka'
import { DEFAULT_ADMIN_PREFERENCES, DEFAULT_PREFERENCES } from '../../lib/preferences'

export const getPreferences = cache(async (user_id: string): Promise<UserPreferences> => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_preferences')
    .select(
      'group_by_set, show_by_color, eureka_set_filter, eureka_category, eureka_obtained_filter, eureka_color, eureka_rarity, theme, color_theme, outfit_set_filter, outfit_category_filter, outfit_evolution_filter, outfit_rarity_filter, outfit_obtained_filter, outfit_group_by_set, outfit_hide_evolutions, outfit_image_mode, outfit_density, sort_order'
    )
    .eq('user_id', user_id)
    .single()

  return data ?? DEFAULT_PREFERENCES
})

export const getAdminPreferences = cache(async (user_id: string): Promise<AdminPreferences> => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('admin_preferences')
    .select('admin_view')
    .eq('user_id', user_id)
    .single()

  return data ?? DEFAULT_ADMIN_PREFERENCES
})
