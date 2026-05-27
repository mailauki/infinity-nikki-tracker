import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EurekaSet, EurekaVariant } from '@/lib/types/eureka'
import { cache } from 'react'
import { getUserID } from '../user'
import { getColors } from './colors'
import { getCategories } from './categories'
import { createEurekaSet, sortVariants, updateEurekaSet } from '../eureka'
import { getObtainedEureka } from './obtained-eureka'

export const getEurekaSets = cache(async () => {
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
			eureka_set_trials ( trial ),
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
  const categories = await getCategories()
  const colors = await getColors()

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
    }
  }) as EurekaSet[]

  const user_id = await getUserID()

  if (!user_id) return eureka

  const obtainedEureka = await getObtainedEureka(user_id)

  const eurekaWithObtained = eureka?.map((eurekaSet) => ({
    ...eurekaSet,
    eureka_variants: eurekaSet.eureka_variants.map((variant) => ({
      ...variant,
      obtained: !!obtainedEureka?.find(
        (obtained) =>
          variant.eureka_set === obtained.eureka_set &&
          variant.category === obtained.category &&
          variant.color === obtained.color
      ),
    })) as EurekaVariant[],
  })) as EurekaSet[]

  return eurekaWithObtained
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
			eureka_set_trials ( trial ),
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

  const categories = await getCategories()
  const colors = await getColors()

  const eureka = createEurekaSet({ eurekaSet, categories, colors })

  const user_id = await getUserID()

  if (!user_id) return eureka

  const obtainedEureka = await getObtainedEureka(user_id)

  const eurekaWithObtained = updateEurekaSet({ eurekaSet: eureka, obtainedEureka })

  return eurekaWithObtained
})
