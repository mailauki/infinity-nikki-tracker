import { cache } from 'react'

import { createClient } from '../../lib/supabase/server'
import { UserPreferences } from '../../lib/types/eureka'
import { DEFAULT_PREFERENCES } from '../../lib/preferences'

export const getPreferences = cache(async (user_id: string): Promise<UserPreferences> => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_preferences')
    .select(
      'group_by_set, show_by_color, dashboard_view, dashboard_tab, eureka_set_filter, eureka_category, eureka_obtained_filter, eureka_color, eureka_rarity, theme'
    )
    .eq('user_id', user_id)
    .single()

  return data ?? DEFAULT_PREFERENCES
})
