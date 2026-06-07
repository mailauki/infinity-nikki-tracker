'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserID } from '@/hooks/user'

async function upsertUserPreference(updates: Record<string, boolean | string | null>) {
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

async function upsertAdminPreference(updates: Record<string, string>) {
  const user_id = await getUserID()
  if (!user_id) return

  const supabase = await createClient()
  const { error } = await supabase
    .from('admin_preferences')
    .upsert({ user_id, ...updates }, { onConflict: 'user_id' })

  if (error) throw new Error(error.message)
}

export async function updateGroupBySet(value: boolean) {
  await upsertUserPreference({ group_by_set: value })
}

export async function updateShowByColor(value: boolean) {
  await upsertUserPreference({ show_by_color: value })
}

export async function updateAdminView(value: 'list' | 'table') {
  await upsertAdminPreference({ admin_view: value })
}

export async function updateEurekaFilters(filters: {
  eureka_set_filter?: string | null
  eureka_category?: string | null
  eureka_obtained_filter?: string | null
  eureka_color?: string | null
  eureka_rarity?: string | null
}) {
  await upsertUserPreference(filters as Record<string, string | null>)
}

export async function updateTheme(value: 'system' | 'light' | 'dark') {
  await upsertUserPreference({ theme: value })
}
