"use client"

import { createClient } from "@/lib/supabase/client"
import { Tables } from "@/lib/types/supabase"
import { EurekaSet } from "@/lib/types/types"
import { useEffect, useState } from "react"
import EurekaSetCard from "./eureka-set-card"

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
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
			{eurekaSets.map((eurekaSet) => (
				<EurekaSetCard
					key={eurekaSet.id}
					eurekaSet={eurekaSet}
				/>
			))}
		</div>
	)
}