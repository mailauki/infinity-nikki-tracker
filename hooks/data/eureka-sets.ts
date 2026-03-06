import { createClient } from '@/lib/supabase/server'
import { EurekaSet, EurekaVariant } from '@/lib/types/eureka'
import { cache } from 'react'
import { getUserID } from '../user'
import { getColors } from './colors'
import { getCategories } from './categories'
import { createEurekaSet, updateEurekaSet } from '../eureka'
import { getObtained } from './obtained-eureka'

export const getEurekaSets = cache(async () => {
  const supabase = await createClient()

  const { data: eurekaSets } = await supabase
    .from('eureka_sets')
    .select(
      `
			id,
			slug,
			title,
			rarity,
			style,
			label,
			trial,
			updated_at,
			eureka_variants (
				id,
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

  const eureka = eurekaSets?.map((eurekaSet) => ({
    ...eurekaSet,
    image_url: eurekaSet.eureka_variants.find((item) => item.default)?.image_url,
    categories: categories,
    colors: [...new Set(eurekaSet.eureka_variants.map((item) => item.color))].flatMap((item) =>
      colors?.filter((color) => color.title === item)
    ),
  })) as EurekaSet[]

  const user_id = await getUserID()

  if (!user_id) return eureka

  const { data: obtained } = await supabase
    .from('obtained')
    .select(
      `
			id,
			eureka_set,
			category,
			color
		`
    )
    .eq('user_id', user_id)

  const eurekaWithObtained = eureka?.map((eurekaSet) => ({
    ...eurekaSet,
    eureka_variants: eurekaSet.eureka_variants.map((item) => ({
      ...item,
      obtained: !!obtained?.find(
        (value) =>
          item.eureka_set === value.eureka_set &&
          item.category === value.category &&
          item.color === value.color
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
			rarity,
			style,
			label,
			trial,
			updated_at,
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
  const categories = await getCategories()
  const colors = await getColors()

  const eureka = createEurekaSet({ eurekaSet, categories, colors })

  const user_id = await getUserID()

  if (!user_id) return eureka

  const obtained = await getObtained(user_id)

  const eurekaWithObtained = updateEurekaSet({ eurekaSet: eureka, obtained })

  return eurekaWithObtained
})
