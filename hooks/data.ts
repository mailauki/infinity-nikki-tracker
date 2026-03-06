import { UUID } from 'crypto'

import { cache } from 'react'

import { createEurekaSet, updateEurekaSet } from '@/hooks/eureka'
import { getUserID } from '@/hooks/user'

import { createClient } from '../lib/supabase/server'
import { Category, Color, EurekaSet, EurekaSetRaw, EurekaVariant, EurekaVariantRaw, Label, Obtained, Style, Trial } from '../lib/types/eureka'

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

  const obtained = await getObtained(user_id!)

  const eurekaWithObtained = updateEurekaSet({ eurekaSet: eureka, obtained })

  return user_id ? eurekaWithObtained : eureka
})

export const getCategories = cache(async () => {
  const supabase = await createClient()

  const { data: categories } = await supabase.from('categories').select('title, image_url')

  return categories as Category[]
})

export const getColors = cache(async () => {
  const supabase = await createClient()

  const { data: colors } = await supabase.from('colors').select('title, image_url')

  return colors as Color[]
})

export const getTrials = cache(async () => {
  const supabase = await createClient()

  const { data: trials } = await supabase
    .from('trials')
    .select('id, slug, title, image_url, updated_at')
    .order('id', { ascending: true })

  return trials as Trial[]
})

export const getStyles = cache(async () => {
  const supabase = await createClient()

  const { data: styles } = await supabase
    .from('styles')
    .select('title')
    .not('title', 'is', null)
    .order('title', { ascending: true })

  return styles as Style[]
})

export const getLabels = cache(async () => {
  const supabase = await createClient()

  const { data: labels } = await supabase
    .from('labels')
    .select('title')
    .not('title', 'is', null)
    .order('title', { ascending: true })

  return labels as Label[]
})

export const getObtained = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

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

  return obtained as Obtained[]
})

export const getEurekaSetsRaw = cache(async () => {
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
			updated_at
			`
    )
    .order('updated_at', { ascending: false, nullsFirst: false })

	return eurekaSets as EurekaSetRaw[]
})

export const getEurekaVariantsRaw = cache(async () => {
  const supabase = await createClient()

  const { data: eurekaVariants } = await supabase
    .from('eureka_variants')
    .select(
      `
			id,
			slug,
			eureka_set,
			color,
			category,
			image_url,
			default,
			updated_at
			`
    )
    .order('id', { ascending: true })

  return eurekaVariants as EurekaVariantRaw[]
})

export const getAdminData = cache(async () => {
  const categories = await getCategories()
  const colors = await getColors()
  const eurekaSets = await getEurekaSetsRaw()
  const eurekaVariants = await getEurekaVariantsRaw()
  const trials = await getTrials()

  return { eurekaSets, categories, colors, eurekaVariants, trials }
})

export const getProfile = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  const {
    data: profile,
    error,
    status,
  } = await supabase
    .from('profiles')
    .select(`full_name, username, avatar_url`)
    .eq('id', user_id)
    .single()

  return { profile, error, status }
})
