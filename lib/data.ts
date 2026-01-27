import { cache } from 'react'
import { createClient } from './supabase/server'
import { Eureka, EurekaSet, Obtained } from './types/types'
import { createEurekaSet, updateEurekaSet } from '@/hooks/eureka-set'
import { UUID } from 'crypto'
import { getUserID } from '@/hooks/user'

export const getEurekaSets = cache(async () => {
	const supabase = await createClient()

	const { data: eurekaSets } = await supabase
	.from('eureka_sets')
	.select(`
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
	`)
	.order('id', { referencedTable: 'eureka', ascending: true })
	const { data: categories } = await supabase
	.from('categories')
	.select('name, image_url')
	const { data: colors } = await supabase
	.from('colors')
	.select('name, image_url')

	const eureka = eurekaSets?.map((eurekaSet) => (
		Object.assign({
			...eurekaSet,
			image_url: eurekaSet.eureka.find((item) => item.default)?.image_url,
			categories: categories,
			colors: [...new Set(eurekaSet.eureka.map((item) => item.color))].flatMap((item) => colors?.filter((color) => color.name === item))
		})
	)) as EurekaSet[]

	const user_id = await getUserID()

	if (!user_id) return eureka

	const { data: obtained } = await supabase
	.from("obtained")
	.select(`
    id,
    eureka_set,
    category,
    color
	`)
	.eq("user_id", user_id)

	const eurekaWithObtained = eureka?.map((eurekaSet) => (
		Object.assign({
			...eurekaSet,
			eureka: eurekaSet.eureka.map((item) => (
				Object.assign({
					...item,
					obtained: obtained?.find((value) => item.eureka_set === value.eureka_set && item.category === value.category && item.color === value.color) ? true : false
				})
			)) as Eureka[]
		})
	)) as EurekaSet[]

	return eurekaWithObtained
})

export const getEurekaSet = cache(async (slug: string) => {
	const supabase = await createClient()

	const { data: eurekaSet } = await supabase
	.from('eureka_sets')
	.select(`
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
	`)
	.order('id', { referencedTable: 'eureka', ascending: true })
	.eq("slug", slug)
	.single()
	const { data: categories } = await supabase
	.from('categories')
	.select('name, image_url')
	const { data: colors } = await supabase
	.from('colors')
	.select('name, image_url')

	const eureka = createEurekaSet({ eurekaSet, categories, colors })

	const user_id = await getUserID()

	const obtained = await getObtained(user_id!)

	const eurekaWithObtained = updateEurekaSet({ eurekaSet: eureka, obtained })

	return user_id ? eurekaWithObtained : eureka
})

export const getTrials = cache(async () => {
	const supabase = await createClient()
	
	const { data: trials } = await supabase
	.from("trials")
	.select("name, image_url")
	.order('id', { ascending: true })

	return trials
})

export const getObtained = cache(async (user_id: UUID|string) => {
	const supabase = await createClient()

	const { data: obtained } = await supabase
	.from("obtained")
	.select(`
    id,
    eureka_set,
    category,
    color
	`)
	.eq("user_id", user_id)

	return obtained as Obtained[]
})
