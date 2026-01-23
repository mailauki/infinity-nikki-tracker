"use client"

import { createClient } from "@/lib/supabase/client"
import { Tables } from "@/lib/types/supabase"
import { Eureka, Quantity } from "@/lib/types/types"
import { useEffect, useState } from "react"
import EurekaCard from "./eureka-card"

type Obtained = Tables<'obtained'>

const supabase = createClient()

export default function RealtimeEureka({
	serverItems,
	serverObtained,
	serverObtainedCount,
}: {
	serverItems: Eureka[],
	serverObtained: Obtained[],
	serverObtainedCount: Quantity[],
}) {
	const [items, setItems] = useState(serverItems)
	const [obtained, setObtained] = useState(serverObtained)
	const [obtainedCount, setObtainedCount] = useState(serverObtainedCount)

	function isObtained(slug: string) {
		const splitSlug = slug.split("-")
		const eureka = splitSlug[0].split("_").join(" ")
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

		const updatedItems = items?.map((item) => (
			Object.assign({
				...item,
				obtained: item.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().filter((value) => value === true).length,
				total: item.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().length,
				categories: item.categories.map((category) => Object.assign(
					{
						...category,
						colors: category.colors.map((color) => Object.assign(
							{
								...color,
								obtained: isObtained(`${item.name.split(" ").join("_")}-${category.name}-${color.name}`)
							}
						))
					}
				))
			}))
		) as Eureka[]

		const updatedObtainedCount = updatedItems.map((item) => Object.assign({
			name: item.name,
			trial: item.trial,
			obtained: item.categories.map((category) => category.colors.map(color => color.obtained).flat()).flat().filter((value) => value === true).length,
			total: item.categories.map(category => category.colors.map(color => color.obtained).flat()).flat().length,
			colors: item.colors.map((itemColor) => Object.assign({
				name: itemColor.name,
				obtained: item.categories.map((category) => category.colors.filter((color) => color.name === itemColor.name)).flat().filter((value) => value.obtained === true).length,
				total: item.categories.map((category) => category.colors.filter((color) => color.name === itemColor.name)).flat().length
			})),
			categories: item.categories.map((category) => Object.assign({
				name: category.name,
				obtained: category.colors.map((color) => color.obtained === true).flat().filter((value) => value === true).length,
				total: category.colors.length,
			}))
		})) as Quantity[]

		setItems(updatedItems)
		setObtainedCount(updatedObtainedCount)
		
		return () => {
			supabase.removeChannel(obtainedChannel)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [obtained])

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
			{items.map((eureka) => (
				<EurekaCard
					key={eureka.id}
					eureka={eureka}
					obtainedCount={(obtained.length > 0) ? obtainedCount : []}
				/>
			))}
		</div>
	)
}