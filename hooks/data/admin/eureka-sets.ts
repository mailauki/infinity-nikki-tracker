import { createClient } from "@/lib/supabase/server"
import { EurekaSet, EurekaSetRaw } from "@/lib/types/eureka"
import { cache } from "react"

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

export const getEurekaSetRaw = cache(async (slug: string) => {
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
			updated_at
			`
		)
		.eq('slug', slug)
		.maybeSingle()

		return eurekaSet as EurekaSetRaw
})

export const addEurekaSet = cache(async (data: EurekaSetRaw) => {
	const supabase = await createClient()
	const { title, slug, rarity, style, label, trial } = data

	const { error } = await supabase.from('eureka_sets').insert([
		// {
		// 	title: title.trim(),
		// 	slug: slug.trim(),
		// 	rarity: rarity === '' ? null : rarity,
		// 	style: style || null,
		// 	label: label || null,
		// 	trial: trial || null,
		// },
		{ title: title.trim(), slug: slug?.trim(), rarity, style, label, trial },
	])
})