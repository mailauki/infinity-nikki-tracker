"use client"

import { createClient } from "@/lib/supabase/client"
import { Tables } from "@/lib/types/supabase"
import { EurekaSet } from "@/lib/types/types"
import { useEffect, useState } from "react"
import EurekaTable from "./eureka-table"
import EurekaHeader from "./eureka-header"

type Obtained = Tables<'obtained'>

const supabase = createClient()

export default function RealtimeEurekaSet({
	serverEurekaSet,
	serverObtained,
}: {
	serverEurekaSet: EurekaSet,
	serverObtained: Obtained[],
}) {
	const [eurekaSet, setEurekaSet] = useState(serverEurekaSet)
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

		const updatedEurekaSet = Object.assign({
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
		}) as EurekaSet

		setEurekaSet(updatedEurekaSet)
		
		return () => {
			supabase.removeChannel(obtainedChannel)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [obtained])

	return (
		<>
			<EurekaHeader eurekaSet={eurekaSet} variant="large" />
			<EurekaTable
				eurekaSet={eurekaSet!}
			/>
		</>
	)
}