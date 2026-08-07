import { cache } from 'react'
import { MakeupSet, MakeupSetRaw } from '@/lib/types/makeup'
import { createClient } from '@/lib/supabase/server'
import { applyObtainedMakeupKeys, buildObtainedMakeupKeySet, createMakeupSet } from '@/hooks/makeup'
import { getMakeupCategories } from './makeup-categories'
import { getMakeupVariants } from './makeup-variants'
import { getObtainedMakeup } from './obtained-makeup'
import { getSeasons } from './seasons'
import { getSeasonCategories } from './season-categories'
import { getUserID } from '../user'

const SET_COLUMNS = `
	id,
	slug,
	title,
	description,
	rarity,
	style,
	label,
	seasons,
	season_category,
	outfit_set,
	"order",
	base_set,
	image_url,
	alt_image_url,
	updated_at
`

// `forUserId` scopes the obtained flags to a specific user instead of the
// viewer — see the note on getOutfitSets. Omit it to resolve the signed-in user.
export const getMakeupSets = cache(async (forUserId?: string) => {
  const supabase = await createClient()

  const [{ data: rows }, variants, makeupCategories, seasons, seasonCategories] = await Promise.all(
    [
      supabase.from('makeup_sets').select(SET_COLUMNS).order('title', { ascending: true }),
      getMakeupVariants(),
      getMakeupCategories(),
      getSeasons(),
      getSeasonCategories(),
    ]
  )

  // Resolve only the outfit sets actually paired with a makeup set. Passing
  // these through matters: createMakeupSet defaults both to [], so omitting
  // them silently yields outfitSet: null and makeup_categories: [] on every
  // set — which is what previously stopped the detail page's paired-outfit
  // link from ever rendering. Keep in step with app/api/makeup/route.ts —
  // that route surfaces a query error here as a 500; this hook has no
  // response to return, so it deliberately falls back to [] instead.
  const pairedSlugs = [
    ...new Set((rows ?? []).map((r) => r.outfit_set).filter(Boolean)),
  ] as string[]
  const { data: outfitSets } = pairedSlugs.length
    ? await supabase.from('outfit_sets').select('slug, title, image_url').in('slug', pairedSlugs)
    : { data: [] }

  const sets = createMakeupSet(
    (rows ?? []) as MakeupSetRaw[],
    variants,
    makeupCategories,
    outfitSets ?? [],
    seasons,
    seasonCategories
  )

  const user_id = forUserId ?? (await getUserID())
  if (!user_id) return sets

  const keys = buildObtainedMakeupKeySet(await getObtainedMakeup(user_id))

  // Evolutions carry their own variants, so both levels need the flags applied.
  return sets.map((set) => ({
    ...set,
    makeup_variants: applyObtainedMakeupKeys(set.makeup_variants, keys),
    evolutions: set.evolutions.map((evolution) => ({
      ...evolution,
      makeup_variants: applyObtainedMakeupKeys(evolution.makeup_variants, keys),
    })),
  }))
})

// Resolves the whole set graph then picks one base set, so the returned set
// carries its evolutions. Passing an evolution's slug returns null by design —
// evolutions are reached through their base set.
export const getMakeupSet = cache(async (slug: string): Promise<MakeupSet | null> => {
  const sets = await getMakeupSets()
  return sets.find((set) => set.slug === slug) ?? null
})
