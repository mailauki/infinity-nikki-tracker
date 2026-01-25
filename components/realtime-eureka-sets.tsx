"use client"

import { createClient } from "@/lib/supabase/client"
import { Tables } from "@/lib/types/supabase"
import { Category, Count, EurekaSet } from "@/lib/types/types"
import { useEffect, useState } from "react"
import EurekaSetCard from "./eureka-set-card"
import { getObtainedSetsCount } from "@/hooks/get-obtained-count"
import ProgressCard from "./progress-card"

type Obtained = Tables<'obtained'>

const supabase = createClient()

export default function RealtimeEurekaSets({
	serverEurekaSets,
	serverObtained,
}: {
	serverEurekaSets: EurekaSet[],
	serverObtained: Obtained[],
}) {
	const [eurekaSets, setEurekaSets] = useState(serverEurekaSets)
	const [obtained, setObtained] = useState(serverObtained)
	const obtainedSetsCount = getObtainedSetsCount(eurekaSets)
	const categories = eurekaSets.map((eurekaSet) => [...new Set(eurekaSet.categories.map((category) => Object.assign({
		name: category.name,
		image_url: category.image_url,
		colors: [],
	}) as Category))])[0]

	const totalCategories = categories.map((eurekaCategory) => (
		Object.assign({
			name: eurekaCategory.name,
			obtained: obtainedSetsCount.reduce((total, setCount) => total + setCount.categories.find((category) => category.name === eurekaCategory.name)!.obtained, 0),
			total: obtainedSetsCount.reduce((total, setCount) => total + setCount.categories.find((category) => category.name === eurekaCategory.name)!.total, 0),
			image_url: eurekaCategory.image_url,
		})
	)) as Count[]

	function isObtained(slug: string) {
		const splitSlug = slug.split("-")
		const eureka = splitSlug[0].replace("_", " ")
		const category = splitSlug[1]
		const color = splitSlug[2]
		
		return obtained?.find((item) => item.eureka === eureka && item.color === color && item.category === category) ? true : false
	}
	
	useEffect(() => {
		const obtainedChannel = supabase.channel('obtained-insert-channel')
		.on(
			'postgres_changes',
			{ event: 'INSERT', schema: 'public', table: 'obtained' },
			(payload) => {
				setObtained([...obtained, payload.new as Obtained])
			}
		)
		.on(
			'postgres_changes',
			{ event: 'DELETE', schema: 'public', table: 'obtained' },
			(payload) => {
				setObtained(obtained.filter((item) => item.id !== payload.old.id))
			}
		)
		.subscribe()

		const updatedEurekaSets = eurekaSets?.map((eurekaSet) => (
			Object.assign({
				...eurekaSet,
				obtained: eurekaSet.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().filter((value) => value === true).length,
				total: eurekaSet.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().length,
				categories: eurekaSet.categories.map((category) => Object.assign(
					{
						...category,
						colors: category.colors.map((color) => Object.assign(
							{
								...color,
								obtained: isObtained(`${eurekaSet.name.replace(" ", "_")}-${category.name}-${color.name}`)
							}
						))
					}
				))
			}))
		) as EurekaSet[]

		setEurekaSets(updatedEurekaSets)
		
		return () => {
			supabase.removeChannel(obtainedChannel)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [obtained])

	return (
		<>
		<div className="grid grid-cols-3 gap-4 p-4">
			{totalCategories.map((category) => (
				<ProgressCard
					key={category.name}
					item={category}
				/>
			))}
		</div>
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
			{eurekaSets.map((eurekaSet) => (
				<EurekaSetCard
					key={eurekaSet.name}
					eurekaSet={eurekaSet}
				/>
			))}
		</div>
		</>
	)
}