'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserID } from '@/hooks/user'

async function upsertPreference(updates: Record<string, boolean | string | null>) {
  const user_id = await getUserID()
  if (!user_id) return

  const supabase = await createClient()
  await supabase
    .from('user_preferences')
    .upsert(
      { user_id, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
}

export async function updateGroupBySet(value: boolean) {
  await upsertPreference({ group_by_set: value })
}

export async function updateShowByColor(value: boolean) {
  await upsertPreference({ show_by_color: value })
}

export async function updateDashboardView(value: 'list' | 'table') {
  await upsertPreference({ dashboard_view: value })
}

export async function updateDashboardTab(value: 'eureka-sets' | 'eureka-variants' | 'trials') {
  await upsertPreference({ dashboard_tab: value })
}

export async function updateEurekaFilters(filters: {
  eureka_set_filter?: string | null
  eureka_category?: string | null
  eureka_obtained_filter?: string | null
  eureka_color?: string | null
  eureka_rarity?: string | null
}) {
  await upsertPreference(filters as Record<string, string | null>)
}
