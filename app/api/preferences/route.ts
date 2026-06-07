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
      'group_by_set, show_by_color, eureka_set_filter, eureka_category, eureka_obtained_filter, eureka_color, eureka_rarity, theme'
    )
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(data ?? DEFAULT_PREFERENCES)
}
