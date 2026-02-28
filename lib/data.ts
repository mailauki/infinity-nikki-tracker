import { UUID } from 'crypto'

import { cache } from 'react'

import { createEurekaSet, updateEurekaSet } from '@/hooks/eureka-set'
import { getUserID } from '@/hooks/user'

import { createClient } from './supabase/server'
import { Eureka, EurekaSet, Obtained } from './types/types'

export const getEurekaSets = cache(async () => {
  const supabase = await createClient()

  const { data: eurekaSets } = await supabase
    .from('eureka_sets')
    .select(
      `
			id,
			slug,
			name,
			quality,
			style,
			labels,
			trial,
			eureka (
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
    .order('id', { referencedTable: 'eureka', ascending: true })
  const { data: categories } = await supabase.from('categories').select('name, image_url')
  const { data: colors } = await supabase.from('colors').select('name, image_url')

  const eureka = eurekaSets?.map((eurekaSet) => ({
    ...eurekaSet,
    image_url: eurekaSet.eureka.find((item) => item.default)?.image_url,
    categories: categories,
    colors: [...new Set(eurekaSet.eureka.map((item) => item.color))].flatMap((item) =>
      colors?.filter((color) => color.name === item)
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
    eureka: eurekaSet.eureka.map((item) => ({
      ...item,
      obtained: !!obtained?.find(
        (value) =>
          item.eureka_set === value.eureka_set &&
          item.category === value.category &&
          item.color === value.color
      ),
    })) as Eureka[],
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
			name,
			quality,
			style,
			labels,
			trial,
			eureka (
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
    .order('id', { referencedTable: 'eureka', ascending: false })
    .eq('slug', slug)
    .single()
  const { data: categories } = await supabase.from('categories').select('name, image_url')
  const { data: colors } = await supabase.from('colors').select('name, image_url')

  const eureka = createEurekaSet({ eurekaSet, categories, colors })

  const user_id = await getUserID()

  const obtained = await getObtained(user_id!)

  const eurekaWithObtained = updateEurekaSet({ eurekaSet: eureka, obtained })

  return user_id ? eurekaWithObtained : eureka
})

export const getTrials = cache(async () => {
  const supabase = await createClient()

  const { data: trials } = await supabase
    .from('trials')
    .select('name, image_url')
    .order('id', { ascending: true })

  return trials
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

export const getAdminData = cache(async () => {
  const supabase = await createClient()

  const { data: eurekaSets } = await supabase
    .from('eureka_sets')
    .select('id, slug, name, quality, style, labels, trial')
    .order('id')
  const { data: categories } = await supabase
    .from('categories')
    .select('name, image_url')
    .order('name')
  const { data: colors } = await supabase.from('colors').select('name, image_url').order('name')

  return { eurekaSets, categories, colors }
})
