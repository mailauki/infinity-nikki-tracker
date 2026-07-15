import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { DEFAULT_PREFERENCES } from '@/lib/preferences'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('Auth error in preferences route:', authError)
    return NextResponse.json(DEFAULT_PREFERENCES)
  }

  if (!user) {
    return NextResponse.json(DEFAULT_PREFERENCES)
  }

  const { data } = await supabase
    .from('user_preferences')
    .select(
      'group_by_set, show_by_color, eureka_set_filter, eureka_category, eureka_obtained_filter, eureka_color, eureka_rarity, theme, color_theme, outfit_set_filter, outfit_category_filter, outfit_evolution_filter, outfit_rarity_filter, outfit_obtained_filter, outfit_group_by_set, outfit_show_base, outfit_show_evolutions, outfit_show_glowups, outfit_image_mode, outfit_density, sort_order, outfit_sort_axis'
    )
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(data ?? DEFAULT_PREFERENCES)
}
