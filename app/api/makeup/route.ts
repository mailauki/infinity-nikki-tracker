import { NextResponse, connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MakeupSetRaw, ObtainedMakeup } from '@/lib/types/makeup'
import { createMakeupSet } from '@/hooks/makeup'
import { getMakeupCategories } from '@/hooks/data/makeup-categories'
import { getMakeupVariants } from '@/hooks/data/makeup-variants'
import { getObtainedMakeup } from '@/hooks/data/obtained-makeup'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'

const SET_COLUMNS = `
  id, slug, title, description, rarity, style, label, seasons, season_category,
  outfit_set, "order", base_set, image_url, alt_image_url, created_at, updated_at
`

export async function GET() {
  // Must precede any cookie read and stay outside the try/catch below: this is
  // what stops PPR from prerendering the route at build time, and the abort
  // signal it raises has to reach React rather than be caught as a 500.
  await connection()

  const supabase = await createClient()

  const [{ data: rows, error }, variants, makeupCategories] = await Promise.all([
    supabase.from('makeup_sets').select(SET_COLUMNS).order('title', { ascending: true }),
    getMakeupVariants(),
    getMakeupCategories(),
  ])

  if (error) {
    console.error('Failed to fetch makeup sets:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Only the sets actually paired with an outfit need resolving.
  const pairedSlugs = [
    ...new Set((rows ?? []).map((r) => r.outfit_set).filter(Boolean)),
  ] as string[]
  const { data: outfitSets } = pairedSlugs.length
    ? await supabase.from('outfit_sets').select('slug, title, image_url').in('slug', pairedSlugs)
    : { data: [] }

  const [styles, labels, seasons, seasonCategories] = await Promise.all([
    getStyles(),
    getLabels(),
    getSeasons(),
    getSeasonCategories(),
  ])

  const makeupSets = createMakeupSet(
    (rows ?? []) as MakeupSetRaw[],
    variants,
    makeupCategories,
    outfitSets ?? []
  )

  const base = { makeupSets, makeupCategories, styles, labels, seasons, seasonCategories }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // getUserID() is null when logged out — never call the user-scoped query with it.
  if (!user) return NextResponse.json(base)

  let obtainedMakeup: ObtainedMakeup[]
  try {
    obtainedMakeup = await getObtainedMakeup(user.id)
  } catch (obtainedError) {
    const message =
      obtainedError instanceof Error ? obtainedError.message : 'Failed to fetch obtained makeup'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ ...base, obtainedMakeup })
}
