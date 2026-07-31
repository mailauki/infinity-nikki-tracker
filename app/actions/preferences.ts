'use server'

// Preference writes on the /outfits path do NOT belong here — they go through
// `POST /api/preferences` via `lib/save-preferences.ts`.
//
// Why: a Server Action that sets cookies — which the Supabase SSR client does
// whenever it refreshes a session — marks its response as revalidated. That
// invalidates the client router cache, which remounts OutfitDataProvider and
// refires its ~6.7s /api/outfits fetch on every single preference toggle. A
// route handler cannot trigger that revalidation, so the same cookie write is
// harmless there.
//
// The outfit/sort-axis/density/image-mode actions that used to live in this file
// were deleted for exactly that reason. Do not add them back — if you need to
// persist a new outfits preference, call `savePreferences({ column: value })`.
// The actions that remain here are for pages where a provider remount is cheap
// (settings, eureka, admin, theme switcher).

import { createClient } from '@/lib/supabase/server'
import { getUserID } from '@/hooks/user'
import type { SortDir } from '@/components/sort-context'

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
  eureka_style?: string | null
  eureka_label?: string | null
}) {
  await upsertUserPreference(filters as Record<string, string | null>)
}

export async function updateTheme(value: 'system' | 'light' | 'dark') {
  await upsertUserPreference({ theme: value })
}

export async function updateColorTheme(value: string) {
  await upsertUserPreference({ color_theme: value })
}

export async function updateSortDir(value: SortDir) {
  await upsertUserPreference({ sort_order: value })
}
