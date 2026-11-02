import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EurekaSet, EurekaVariant } from '@/lib/types/eureka'
import { firstLinked } from '@/lib/types/outfit'
import { cache } from 'react'
import { getUserID } from '../user'
import { getEurekaColors } from './eureka-colors'
import { getEurekaCategories } from './eureka-categories'
import {
  applyObtainedKeys,
  buildObtainedKeySet,
  createEurekaSet,
  sortVariants,
  updateEurekaSet,
} from '../eureka'
import { getObtainedEureka } from './obtained-eureka'
import { earliestRelease, resolveRelease } from '../release'

// Every set with its variants, no obtained flags — the same for every viewer,
// which is what lets /api/eureka be CDN-cached (see lib/catalog-cache.ts).
export const getEurekaCatalogSets = cache(async () => {
  const supabase = await createClient()

  const { data: eurekaSets } = await supabase
    .from('eureka_sets')
    .select(
      `
			id,
			slug,
			title,
			description,
			rarity,
			style,
			label,
			updated_at,
			released_at,
			version,
			seasons,
			eureka_set_trials ( trial, trials ( released_at, version ) ),
			eureka_variants (
				id,
				slug,
				eureka_set,
				color,
				category,
				image_url,
				default
			)
		`
    )
    .order('id', { ascending: true })
    .order('id', { referencedTable: 'eureka_variants', ascending: true })
  const [categories, colors] = await Promise.all([getEurekaCategories(), getEurekaColors()])

  const categoryOrder = (categories ?? []).map((c) => c.slug)
  const eureka = eurekaSets?.map((eurekaSet) => {
    const defaultColorSlug = eurekaSet.eureka_variants.find((v) => v.default)?.color
    const colorSlugs = [...new Set(eurekaSet.eureka_variants.map((v) => v.color))]
    const resolvedColors = colorSlugs
      .flatMap((slug) => colors?.filter((c) => c.slug === slug) ?? [])
      .sort((a, b) => {
        if (a.slug === defaultColorSlug) return -1
        if (b.slug === defaultColorSlug) return 1
        if (a.slug === 'iridescent') return 1
        if (b.slug === 'iridescent') return -1
        return 0
      })
    return {
      ...eurekaSet,
      image_url: (
        eurekaSet.eureka_variants.find((v) => v.default && v.category === 'head') ??
        eurekaSet.eureka_variants.find((v) => v.default)
      )?.image_url,
      categories: categories,
      colors: resolvedColors,
      eureka_variants: sortVariants(
        eurekaSet.eureka_variants as EurekaVariant[],
        defaultColorSlug,
        categoryOrder
      ),
      release: resolveRelease(
        eurekaSet,
        earliestRelease(eurekaSet.eureka_set_trials.map((link) => firstLinked(link.trials)))
      ),
    }
  }) as unknown as EurekaSet[]

  return eureka ?? []
})

// `forUserId` scopes the obtained flags to a specific user instead of the
// viewer. Public profile pages need it: without it every visitor would see
// their OWN progress rendered under someone else's name. Omit it (the default)
// and it resolves the signed-in viewer as before.
export const getEurekaSets = cache(async (forUserId?: string) => {
  const eureka = await getEurekaCatalogSets()
  const user_id = forUserId ?? (await getUserID())

  if (!user_id) return eureka

  const obtainedEureka = await getObtainedEureka(user_id)
  return applyObtainedKeys(eureka, buildObtainedKeySet(obtainedEureka))
})

export const getEurekaSet = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: eurekaSet } = await supabase
    .from('eureka_sets')
    .select(
      `
			id,
			slug,
			title,
			description,
			rarity,
			style,
			label,
			updated_at,
			released_at,
			version,
			seasons,
			eureka_set_trials ( trial, trials ( released_at, version ) ),
			eureka_variants (
				id,
				slug,
				eureka_set,
				color,
				category,
				image_url,
				default
			)
		`
    )
    .order('id', { ascending: true })
    .order('id', { referencedTable: 'eureka_variants', ascending: false })
    .eq('slug', slug)
    .single()
  if (!eurekaSet) notFound()

  const categories = await getEurekaCategories()
  const colors = await getEurekaColors()

  const release = resolveRelease(
    eurekaSet,
    earliestRelease(eurekaSet.eureka_set_trials.map((link) => firstLinked(link.trials)))
  )

  const eureka = createEurekaSet({ eurekaSet: { ...eurekaSet, release }, categories, colors })

  const user_id = await getUserID()

  if (!user_id) return eureka

  const obtainedEureka = await getObtainedEureka(user_id)

  const eurekaWithObtained = updateEurekaSet({ eurekaSet: eureka, obtainedEureka })

  return eurekaWithObtained
})
