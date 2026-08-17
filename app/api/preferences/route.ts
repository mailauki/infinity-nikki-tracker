import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { DEFAULT_PREFERENCES } from '@/lib/preferences'

// Every column the client is allowed to write. An explicit allowlist keeps a
// malicious or malformed body from writing arbitrary columns through the upsert.
const WRITABLE_KEYS = new Set([
  'group_by_set',
  'show_by_color',
  'eureka_set_filter',
  'eureka_category',
  'eureka_obtained_filter',
  'eureka_color',
  'eureka_rarity',
  'eureka_style',
  'eureka_label',
  'eureka_trial',
  'theme',
  'color_theme',
  'text_scale',
  'outfit_set_filter',
  'outfit_category_filter',
  'outfit_evolution_filter',
  'outfit_rarity_filter',
  'outfit_obtained_filter',
  'outfit_style_filter',
  'outfit_label_filter',
  'outfit_season_filter',
  'outfit_season_category_filter',
  'outfit_group_by_set',
  'outfit_hide_evolutions',
  'outfit_hide_glowups',
  'outfit_image_mode',
  'outfit_density',
  'sort_order',
  'outfit_sort_axis',
  'momo_rarity_filter',
  'momo_season_filter',
  'momo_season_category_filter',
  'momo_obtained_filter',
  'momo_location_filter',
  'makeup_sort_axis',
  'makeup_density',
  'makeup_image_mode',
])

// Kept in sync with WRITABLE_KEYS and the UserPreferences type. Every field the
// type exposes must be selected here, or clients silently read `undefined`.
const PREFERENCE_COLUMNS =
  'group_by_set, show_by_color, eureka_set_filter, eureka_category, eureka_obtained_filter, eureka_color, eureka_rarity, eureka_style, eureka_label, eureka_trial, theme, color_theme, text_scale, outfit_set_filter, outfit_category_filter, outfit_evolution_filter, outfit_rarity_filter, outfit_obtained_filter, outfit_style_filter, outfit_label_filter, outfit_season_filter, outfit_season_category_filter, outfit_group_by_set, outfit_hide_evolutions, outfit_hide_glowups, outfit_image_mode, outfit_density, sort_order, outfit_sort_axis, momo_rarity_filter, momo_season_filter, momo_season_category_filter, momo_obtained_filter, momo_location_filter, makeup_sort_axis, makeup_density, makeup_image_mode'

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
    .select(PREFERENCE_COLUMNS)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(data ?? DEFAULT_PREFERENCES)
}

// Preference writes go through this route rather than a Server Action. The
// Supabase SSR client sets auth cookies when it refreshes a session; inside a
// Server Action that marks the response as revalidated, which invalidates the
// client router cache, remounts OutfitDataProvider, and refires its ~6.7s
// /api/outfits fetch. Route handlers cannot trigger that revalidation.
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (WRITABLE_KEYS.has(key)) updates[key] = value
  }

  // Nothing recognized in the body — treat as a no-op rather than an error so a
  // caller sending only unknown keys doesn't surface a failure in the UI.
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })

  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      { user_id: user.id, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('Failed to persist preferences:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
